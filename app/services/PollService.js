import prisma from "@/lib/prisma";
import { generateNewPoll } from "@/lib/ai";
import { io } from "socket.io-client";

// Backend-to-Backend socket connection for event propagation
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://socket:3001");

export class PollService {
    static async getCurrentPoll() {
        return await prisma.poll.findFirst({
            where: { active: true },
            include: {
                optionA: { include: { _count: { select: { votes: true } } } },
                optionB: { include: { _count: { select: { votes: true } } } },
                category: true
            },
            orderBy: { createdAt: 'desc' }
        });
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

            // 4. Create new poll with the options and dynamic images
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

            // Notify all clients via socket
            socket.emit("poll-update", newPoll);

            return newPoll;
        } catch (error) {
            console.error("Poll rotation failed:", error);
            throw error; // Let the API handler manage the fallback
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
        const vote = await prisma.vote.create({
            data: { pollId, optionId }
        });

        // Notify socket server of new vote
        socket.emit("vote", { pollId, optionId });

        return vote;
    }
}
