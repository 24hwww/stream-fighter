import { PrismaClient } from '@prisma/client';
import StreamLayout from "@/components/stream/StreamLayout";
import { notFound } from 'next/navigation';

const prisma = new PrismaClient();

export default async function ScreenPage({ params }) {
    const { id } = await params;

    // Fetch screen config from DB
    const streamConfig = await prisma.stream.findUnique({
        where: { slug: id }
    });

    // If it's the "principal" one and not in DB, we still show the layout
    if (!streamConfig) {
        if (id === 'principal') {
            return <StreamLayout />;
        }
        return notFound();
    }

    // Here we can inject dynamic props based on streamConfig.uiConfig
    // For example, custom categories, colors, or AI behaviors
    return (
        <StreamLayout
            config={streamConfig.uiConfig}
            name={streamConfig.name}
        />
    );
}
