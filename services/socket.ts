import { io, Socket } from 'socket.io-client';

const getSocketUrl = () => {
    // Check for environment variable first
    if (process.env.NEXT_PUBLIC_SOCKET_URL) {
        return process.env.NEXT_PUBLIC_SOCKET_URL;
    }

    // Dynamic fallback based on current environment
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
            return 'http://localhost:5000';
        }
    }

    // Default production URL as final fallback
    return 'https://digitalmenu-server.onrender.com';
};

const SOCKET_URL = getSocketUrl();

class SocketService {
    private socket: Socket | null = null;
    private rooms: Set<string> = new Set();
    private handlers: Map<string, Set<(data: any) => void>> = new Map();

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                withCredentials: true,
                transports: ['polling', 'websocket'],
                path: '/socket.io/',
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 2000,
                reconnectionDelayMax: 10000,
            });

            this.socket.on('connect', () => {
                console.log('Connected to socket server, id:', this.socket?.id);
                // Re-join all rooms automatically after a reconnect
                this.rooms.forEach(room => {
                    this.socket?.emit('join', room);
                    console.log(`[Socket] Re-joined room on connect: ${room}`);
                });
                // Re-attach all stored handlers to the new socket instance
                this.handlers.forEach((handlers, event) => {
                    handlers.forEach(handler => {
                        this.socket?.on(event, handler);
                    });
                });
            });

            this.socket.on('connect_error', (error) => {
                console.error('Socket connection error:', error.message);
            });

            this.socket.on('disconnect', (reason) => {
                console.log('Socket disconnected:', reason);
            });
        }
        return this.socket;
    }

    join(room: string) {
        if (!room) return;
        this.rooms.add(room); // Track room for auto-rejoin on reconnect

        if (!this.socket) {
            console.warn('[SocketService] Attempted to join room before connection');
            return;
        }

        if (this.socket.connected) {
            this.socket.emit('join', room);
            console.log(`[Socket] Joined room: ${room}`);
        } else {
            // Wait for connect event then join
            this.socket.once('connect', () => {
                this.socket?.emit('join', room);
                console.log(`[Socket] Joined room on connect: ${room}`);
            });
        }
    }

    leave(room: string) {
        this.rooms.delete(room);
        if (this.socket?.connected) {
            this.socket.emit('leave', room);
            console.log(`[Socket] Left room: ${room}`);
        }
    }

    on(event: string, callback: (data: any) => void) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event)!.add(callback);

        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event: string, callback?: (data: any) => void) {
        if (!this.socket) return;

        if (callback) {
            // Remove specific handler
            this.socket.off(event, callback);
            this.handlers.get(event)?.delete(callback);
        } else {
            // Remove all handlers for this event that we know about
            const handlers = this.handlers.get(event);
            if (handlers) {
                handlers.forEach((handler) => {
                    this.socket?.off(event, handler);
                });
                handlers.clear();
            }
        }
    }

    emit(event: string, data?: any) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }

    disconnect() {
        if (this.socket) {
            this.rooms.clear();
            // Clear all handlers
            this.handlers.forEach((handlers, event) => {
                handlers.forEach((handler) => {
                    this.socket?.off(event, handler);
                });
            });
            this.handlers.clear();
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new SocketService();
