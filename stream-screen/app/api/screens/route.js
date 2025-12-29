import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    const screens = await prisma.stream.findMany({
        orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(screens);
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, slug, streamKey, description, uiConfig } = body;

        const screen = await prisma.stream.create({
            data: {
                name,
                slug,
                streamKey,
                description,
                uiConfig: uiConfig || {},
                isActive: false
            }
        });

        return NextResponse.json(screen);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, ...data } = body;

        const screen = await prisma.stream.update({
            where: { id },
            data
        });

        return NextResponse.json(screen);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        await prisma.stream.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
