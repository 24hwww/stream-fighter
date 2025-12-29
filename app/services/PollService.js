import prisma from "@/lib/prisma";
import { generateNewPoll } from "@/lib/ai";

export class PollService {
    static async getCurrentPoll() {
        return await prisma.poll.findFirst({
            where: { active: true },
            include: { optionA: true, optionB: true, category: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async rotatePoll(categoryName = "General") {
        // 1. Deactivate current poll
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

        // 4. Create new poll with the options
        const newPoll = await prisma.poll.create({
            data: {
                categoryId: category.id,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
                optionA: {
                    create: { name: aiData.optionA.name, image: aiData.optionA.image || null }
                },
                optionB: {
                    create: { name: aiData.optionB.name, image: aiData.optionB.image || null }
                }
            }
        });

        return newPoll;
    }

    static async registerVote(pollId, optionId) {
        return await prisma.vote.create({
            data: { pollId, optionId }
        });
    }
}
