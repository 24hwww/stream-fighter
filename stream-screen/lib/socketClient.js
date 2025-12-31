import { io } from 'socket.io-client';

/**
 * Helper para crear conexiones Socket.IO consistentes
 * Maneja la URL correcta tanto en servidor como cliente
 */
export function createSocketClient() {
    let socketUrl;

    if (typeof window !== 'undefined') {
        // Cliente (navegador)
        const hostname = window.location.hostname;
        const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

        if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
            // Si hay una URL de env que no es localhost, la usamos (probablemente prod)
            socketUrl = envUrl;
            console.log('[SocketClient] Using NEXT_PUBLIC_SOCKET_URL:', socketUrl);
        } else {
            // En desarrollo o si no hay URL, usamos el hostname actual con puerto 3011
            // Esto permite que funcione en mobile usando la IP que el usuario asigne
            socketUrl = `http://${hostname}:3011`;
            console.log('[SocketClient] Using dynamic URL:', socketUrl);
        }
    } else {
        // Servidor (Node.js)
        // Usar el nombre del servicio Docker (puerto interno 3001)
        socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://stream-socket:3001";
        console.log('[SocketClient] Server-side URL:', socketUrl);
    }

    const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000
    });

    socket.on('connect', () => {
        console.log('[SocketClient] Connected:', socket.id, 'to', socketUrl);
    });

    socket.on('disconnect', () => {
        console.log('[SocketClient] Disconnected');
    });

    socket.on('connect_error', (error) => {
        console.error('[SocketClient] Connection error:', error.message, 'URL:', socketUrl);
    });

    return socket;
}
