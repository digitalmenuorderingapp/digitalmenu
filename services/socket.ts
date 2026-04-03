import { io, Socket } from 'socket.io-client';

const getSocketUrl = () => {
    // Hardcoded production URL as requested to avoid environment variable issues on Vercel/Render
    return 'https://digitalmenu-server.onrender.com';
};

const SOCKET_URL = getSocketUrl();

class SocketService {
    private socket: Socket | null = null;
    private currentRoom: string | null = null;
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
                // Re-join the room automatically after a reconnect
                if (this.currentRoom) {
                    this.socket?.emit('join', this.currentRoom);
                }
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
        this.currentRoom = room; // Track current room for auto-rejoin on reconnect

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

    disconnect() {
        if (this.socket) {
            this.currentRoom = null;
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
