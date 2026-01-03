import { NextResponse } from "next/server";

async function getNetworkIp() {
    try {
        const { execSync } = await import('child_process');
        // Try to get the network IP from the host
        // This works when running in Docker
        const ip = execSync("hostname -I | awk '{print $1}'", { encoding: 'utf8' }).trim();
        if (ip && !ip.includes('127.0.0.1')) {
            return ip;
        }
    } catch {
        // Ignore errors
    }

    // Fallback: try to get from environment
    return process.env.NETWORK_IP || process.env.NEXT_PUBLIC_NETWORK_IP || null;
}

export async function GET(request) {
    // Get the host from the request headers
    const host = request.headers.get('host') || 'localhost:3010';
    const hostname = host.split(':')[0];
    const port = host.split(':')[1] || '3010';

    let baseUrl;

    // If accessing via localhost/127.0.0.1, try to get network IP
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Try environment variable first (most reliable)
        // Check both server-side and client-side env vars
        const envNetworkIp = process.env.NETWORK_IP || process.env.NEXT_PUBLIC_NETWORK_IP;
        console.log('NETWORK_IP env var:', envNetworkIp);
        if (envNetworkIp) {
            baseUrl = `http://${envNetworkIp}:${port}`;
        } else {
            // Try to detect from host (works if running in Docker with host network)
            const detectedIp = await getNetworkIp();
            // Only use detected IP if it's not a Docker internal IP (172.x.x.x, 10.x.x.x docker ranges)
            if (detectedIp && !detectedIp.startsWith('172.17.') && !detectedIp.startsWith('172.18.') &&
                !detectedIp.startsWith('172.19.') && !detectedIp.startsWith('172.20.') &&
                !detectedIp.startsWith('172.21.') && !detectedIp.startsWith('172.22.') &&
                !detectedIp.startsWith('172.23.') && !detectedIp.startsWith('172.24.') &&
                !detectedIp.startsWith('172.25.') && !detectedIp.startsWith('172.26.') &&
                !detectedIp.startsWith('172.27.') && !detectedIp.startsWith('172.28.') &&
                !detectedIp.startsWith('172.29.') && !detectedIp.startsWith('172.30.') &&
                !detectedIp.startsWith('172.31.')) {
                baseUrl = `http://${detectedIp}:${port}`;
            } else {
                // Fallback: return host as-is (will work if client accesses via network IP)
                baseUrl = `http://${host}`;
            }
        }
    } else {
        // Client is accessing via network IP, use that (this is the best case)
        baseUrl = `http://${host}`;
    }

    return NextResponse.json({
        baseUrl,
        host,
        hostname,
        port,
        networkIp: process.env.NETWORK_IP || process.env.NEXT_PUBLIC_NETWORK_IP || await getNetworkIp()
    });
}
