import prisma from "@/lib/prisma";
import { generateNewPoll } from "@/lib/ai";
import { createSocketClient } from "@/lib/socketClient";
import redis from "@/lib/redis";

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
            console.error("[PollService] Redis read error:", e);
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
            await redis.set(POLL_CACHE_KEY, JSON.stringify(poll), "EX", 300);
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

            // 2. Generate new options using AI
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
                            image: aiData.optionA.image ? `https://loremflickr.com/800/800/${encodeURIComponent(aiData.optionA.image)}?lock=${Math.floor(Math.random() * 1000)}` : null
                        }
                    },
                    optionB: {
                        create: {
                            name: aiData.optionB.name,
                            image: aiData.optionB.image ? `https://loremflickr.com/800/800/${encodeURIComponent(aiData.optionB.image)}?lock=${Math.floor(Math.random() * 1000)}` : null
                        }
                    }
                },
                include: {
                    optionA: { include: { _count: { select: { votes: true } } } },
                    optionB: { include: { _count: { select: { votes: true } } } },
                    category: true
                }
            });

            // 5. Update Redis cache immediately
            await redis.set(POLL_CACHE_KEY, JSON.stringify(newPoll), "EX", 305);

            // Notify via socket
            socket.emit("poll-update", newPoll);

            return newPoll;
        } catch (error) {
            console.error("Poll rotation failed:", error);
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
        // En un sistema de alto tráfico, podríamos registrar esto solo en Redis 
        // e ir sincronizando a Postgres por lotes. 
        // Por ahora, lo hacemos en DB y actualizamos el cache de Redis.

        const vote = await prisma.vote.create({
            data: { pollId, optionId }
        });

        // Actualizar el cache de Redis (opcionalmente podríamos invalidarlo o actualizarlo)
        // Invalidar es más seguro: el siguiente que pida el poll forzará lectura fresca de DB con contadores actualizados.
        await redis.del(POLL_CACHE_KEY);

        // Notify socket server
        socket.emit("vote", { pollId, optionId });

        console.log(`[PollService] Vote registered: pollId=${pollId}, optionId=${optionId}`);

        return vote;
    }
}
