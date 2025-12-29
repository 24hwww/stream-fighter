import { NextResponse } from 'next/server';
import { streamService } from '@/lib/streamService';

export async function GET() {
    const streams = streamService.listStreams();
    return NextResponse.json({ activeStreams: streams });
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { screenId, streamKey } = body;

        if (!screenId || !streamKey) {
            return NextResponse.json({ error: 'Missing screenId or streamKey' }, { status: 400 });
        }

        const result = await streamService.startStream(screenId, streamKey);
        return NextResponse.json(result);
    } catch (error) {
        console.error('API Stream Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const streamKey = searchParams.get('streamKey');

        if (!streamKey) {
            return NextResponse.json({ error: 'Missing streamKey parameter' }, { status: 400 });
        }

        const stopped = streamService.stopStream(streamKey);
        return NextResponse.json({ stopped, streamKey });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
