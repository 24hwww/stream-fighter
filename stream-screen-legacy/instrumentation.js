export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { Path2D } = await import('skia-canvas');
        if (typeof global !== 'undefined') {
            global.Path2D = Path2D;
            console.log('[Instrumentation] Path2D polyfill active');
        }

        const { streamService } = await import('./lib/streamService');

        // Check if we should auto-start a principal stream
        const principalKey = process.env.STREAM_KEY;

        if (principalKey) {
            console.log(`[Instrumentation] Auto-starting principal stream with key: ${principalKey}`);

            // Delay to allow Next.js to fully start and listen on port 3000
            setTimeout(async () => {
                try {
                    // Using 'principal' as the default ID for the /screen/[id] route
                    await streamService.startStream('principal', principalKey);
                } catch (e) {
                    console.error('[Instrumentation] Auto-start failed:', e);
                }
            }, 20000);
        }
    }
}
