import prisma from "@/lib/prisma";
import { generateNewPoll } from "@/lib/ai";
import { createSocketClient } from "@/lib/socketClient";
import redis from "@/lib/redis";
import { fighterStateService } from "@/lib/fighterStateService";
import { createLogger } from "@/lib/logger";

const log = createLogger('PollService');

// Backend-to-Backend socket connection for event propagation
const socket = createSocketClient();

const POLL_CACHE_KEY = "current_poll_full";

export class PollService {
    static async getCurrentPoll() {
        try {
            // 1. Try to get from Redis
            const cached = await redis.get(POLL_CACHE_KEY);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (e) {
            log.error('Redis read error:', e.message);
        }

        // 2. Fallback to DB
        const poll = await prisma.poll.findFirst({
            where: { active: true },
            include: {
                optionA: { include: { _count: { select: { votes: true } } } },
                optionB: { include: { _count: { select: { votes: true } } } },
                category: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // 3. Cache it (expire in 5 mins)
        if (poll) {
            try {
                await redis.set(POLL_CACHE_KEY, JSON.stringify(poll), "EX", 300);
            } catch (e) {
                log.warn('Failed to cache poll:', e.message);
            }
        }

        return poll;
    }

    static async rotatePoll(categoryName = "General") {
        try {
            // 1. Deactivate all active polls
            await prisma.poll.updateMany({
                where: { active: true },
                data: { active: false }
            });

            // 2. Generate new options using AI (Now includes full designs)
            const aiData = await generateNewPoll(categoryName);

            // 3. Find or create category
            const category = await prisma.category.upsert({
                where: { name: categoryName },
                update: {},
                create: { name: categoryName }
            });

            // 4. Create new poll
            const newPoll = await prisma.poll.create({
                data: {
                    category: { connect: { id: category.id } },
                    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
                    optionA: {
                        create: {
                            name: aiData.optionA.name,
                            image: null
                        }
                    },
                    optionB: {
                        create: {
                            name: aiData.optionB.name,
                            image: null
                        }
                    }
                },
                include: {
                    optionA: { include: { _count: { select: { votes: true } } } },
                    optionB: { include: { _count: { select: { votes: true } } } },
                    category: true
                }
            });

            // 5. Store designs in Redis linked to poll ID
            const designs = {
                fighterA: aiData.optionA.design,
                fighterB: aiData.optionB.design,
                stage: aiData.stage
            };
            await redis.set(`designs_poll_${newPoll.id}`, JSON.stringify(designs), "EX", 1200); // 20 mins

            // 6. Update Redis cache immediately
            await redis.set(POLL_CACHE_KEY, JSON.stringify(newPoll), "EX", 305);

            // Notify via socket
            socket.emit("poll-update", newPoll);

            return newPoll;
        } catch (error) {
            log.error('Poll rotation failed:', error.message, error.stack);
            throw error;
        }
    }

    static async getPreviousPoll() {
        return await prisma.poll.findFirst({
            where: { active: false },
            include: {
                optionA: { include: { _count: { select: { votes: true } } } },
                optionB: { include: { _count: { select: { votes: true } } } },
                category: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async registerVote(pollId, optionId) {
        // 1. Registro asíncrono en DB (fuego y olvido para velocidad si queremos, pero lo mantenemos síncrono para integridad)
        const vote = await prisma.vote.create({
            data: { pollId, optionId }
        });

        // 2. Actualización de CACHE INCREMENTAL (Crítico para Real-Time)
        let pollData = null;
        try {
            const cached = await redis.get(POLL_CACHE_KEY);
            if (cached) {
                pollData = JSON.parse(cached);
                // Si el pollId coincide, incrementamos en memoria
                if (pollData.id === pollId) {
                    if (pollData.optionA.id === optionId) {
                        pollData.optionA._count.votes++;
                    } else if (pollData.optionB.id === optionId) {
                        pollData.optionB._count.votes++;
                    }
                    // Guardamos de nuevo el cache actualizado
                    await redis.set(POLL_CACHE_KEY, JSON.stringify(pollData), "EX", 305);
                } else {
                    pollData = null; // Cache desincronizado
                }
            }
        } catch (e) {
            log.error('Incremental cache update failed:', e.message);
        }

        // 3. Fallback a lectura completa si no había cache o falló
        if (!pollData) {
            pollData = await this.getCurrentPoll();
        }

        // 4. Actualizar estado de combate (HP, animaciones)
        let combatState = null;
        if (pollData) {
            combatState = await fighterStateService.updateCombat(pollId, pollData);
        }

        // 5. Notificar al Socket Server con DATA COMPLETA (Votos + Estado de Combate)
        // Esto permite sincronización instantánea sin fetch()
        if (pollData && combatState) {
            socket.emit("vote", {
                pollId,
                optionId,
                optionA_votes: pollData.optionA._count.votes,
                optionB_votes: pollData.optionB._count.votes,
                combatState // Enviamos el estado fresco (HP, animaciones)
            });
        } else if (pollData) {
            socket.emit("vote", {
                pollId,
                optionId,
                optionA_votes: pollData.optionA._count.votes,
                optionB_votes: pollData.optionB._count.votes
            });
        } else {
            // Fallback total
            socket.emit("vote", { pollId, optionId });
        }

        log.debug(`Vote registered (Real-Time): pollId=${pollId}, optionId=${optionId}`);

        return vote;
    }
}
