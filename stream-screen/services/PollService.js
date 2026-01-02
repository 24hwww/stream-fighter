import prisma from "@/lib/prisma";
import { generateNewPoll } from "@/lib/ai";
import { createSocketClient } from "@/lib/socketClient";
import redis from "@/lib/redis";
import { fighterStateService } from "@/lib/fighterStateService";
import { createLogger } from "@/lib/logger";

const log = createLogger('PollService');
const socket = createSocketClient();
const POLL_CACHE_KEY = "current_poll_full";

export class PollService {
    static async getCurrentPoll() {
        try {
            const cached = await redis.get(POLL_CACHE_KEY);
            if (cached) return JSON.parse(cached);
        } catch (e) { log.error('Redis read error:', e.message); }

        const poll = await prisma.poll.findFirst({
            where: { active: true },
            include: {
                optionA: { include: { _count: { select: { votes: true } } } },
                optionB: { include: { _count: { select: { votes: true } } } },
                category: true
            },
            orderBy: { createdAt: 'desc' }
        });

        if (poll) {
            await redis.set(POLL_CACHE_KEY, JSON.stringify(poll), "EX", 300);
            // Ensure socket server knows current ID for heartbeat
            socket.emit("poll-update", poll);
        }
        return poll;
    }

    static async rotatePoll(categoryName = "General") {
        try {
            log.info(`Rotating poll for ${categoryName}...`);

            // ARCHITECT OPTIMIZATION: Check pre-warmed AI data
            const prewarmedKey = `prewarmed_poll_${categoryName}`;
            const prewarmed = await redis.get(prewarmedKey);
            let aiData;

            if (prewarmed) {
                aiData = JSON.parse(prewarmed);
                await redis.del(prewarmedKey);
                log.info('Using pre-warmed AI matchup');
            } else {
                aiData = await generateNewPoll(categoryName);
            }

            await prisma.poll.updateMany({
                where: { active: true },
                data: { active: false }
            });

            const category = await prisma.category.upsert({
                where: { name: categoryName },
                update: {},
                create: { name: categoryName }
            });

            const newPoll = await prisma.poll.create({
                data: {
                    category: { connect: { id: category.id } },
                    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                    optionA: {
                        create: {
                            name: aiData.optionA.name,
                            image: aiData.optionA.characterKey
                        }
                    },
                    optionB: {
                        create: {
                            name: aiData.optionB.name,
                            image: aiData.optionB.characterKey
                        }
                    }
                },
                include: {
                    optionA: { include: { _count: { select: { votes: true } } } },
                    optionB: { include: { _count: { select: { votes: true } } } },
                    category: true
                }
            });

            // Store designs
            const designs = {
                fighterA: aiData.optionA.design,
                fighterB: aiData.optionB.design,
                stage: aiData.stage
            };
            await redis.set(`designs_poll_${newPoll.id}`, JSON.stringify(designs), "EX", 1200);
            await redis.set(POLL_CACHE_KEY, JSON.stringify(newPoll), "EX", 305);

            // ARCHITECT OPTIMIZATION: Initialize fighter state IMMEDIATELY
            // This ensures the timer starts ticking even if no one has voted.
            await fighterStateService.initializeState(newPoll.id);

            // Notify Socket Engine
            socket.emit("poll-update", newPoll);

            // Prepare next round in background
            this.prewarmNextPoll(categoryName);

            return newPoll;
        } catch (error) {
            log.error("Rotation failed:", error.message);
            throw error;
        }
    }

    static async prewarmNextPoll(categoryName = "General") {
        setTimeout(async () => {
            try {
                const aiData = await generateNewPoll(categoryName);
                await redis.set(`prewarmed_poll_${categoryName}`, JSON.stringify(aiData), "EX", 3600);
                log.info('Next poll pre-warmed');
            } catch (e) { log.error('Pre-warm failed:', e.message); }
        }, 2000);
    }

    static async registerVote(pollId, optionId) {
        // ARCHITECT OPTIMIZATION: Redis-First Counting
        // Atomic increment in Redis for instantaneous feedback
        const redisKey = `votes_count_${pollId}_${optionId}`;
        const currentVotes = await redis.incr(redisKey);

        // Background sync to Postgres (Debounced/Queued would be better, but this is a start)
        prisma.vote.create({ data: { pollId, optionId } }).catch(e => log.error('DB Vote sync error:', e.message));

        const cached = await redis.get(POLL_CACHE_KEY);
        if (cached) {
            const pollData = JSON.parse(cached);
            if (pollData.id === pollId) {
                // Update local counts in cache
                if (pollData.optionA.id === optionId) pollData.optionA._count.votes = currentVotes;
                else if (pollData.optionB.id === optionId) pollData.optionB._count.votes = currentVotes;

                await redis.set(POLL_CACHE_KEY, JSON.stringify(pollData), "EX", 305);

                // Calculate Combat State
                const combatState = await fighterStateService.updateCombat(pollId, pollData);

                // Broadcast update
                socket.emit("vote", {
                    pollId,
                    optionA_votes: pollData.optionA._count.votes,
                    optionB_votes: pollData.optionB._count.votes,
                    combatState
                });
            }
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
}
