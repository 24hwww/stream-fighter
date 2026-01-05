import { io } from 'socket.io-client';
import { createLogger } from './logger.js';

const log = createLogger('SocketClient');

/**
 * Helper para crear conexiones Socket.IO consistentes
 * Maneja la URL correcta tanto en servidor como cliente
 */
let socketInstance = null;

export function createSocketClient() {
    if (socketInstance) return socketInstance;

    let socketUrl;

    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

        if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
            socketUrl = envUrl;
            log.info('Using NEXT_PUBLIC_SOCKET_URL:', socketUrl);
        } else {
            socketUrl = `http://${hostname}:3011`;
            log.debug('Using dynamic URL:', socketUrl);
        }
    } else {
        socketUrl = process.env.INTERNAL_SOCKET_URL || "http://stream-socket:3001";
        log.info('Server-side URL (Internal):', socketUrl);
    }

    socketInstance = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000
    });

    socketInstance.on('connect', () => {
        log.info('Connected:', socketInstance.id, 'to', socketUrl);
    });

    socketInstance.on('disconnect', () => {
        log.warn('Disconnected');
    });

    socketInstance.on('connect_error', (error) => {
        log.error('Connection error:', error.message, 'URL:', socketUrl);
    });

    return socketInstance;
}
