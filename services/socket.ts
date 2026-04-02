import { io, Socket } from 'socket.io-client';

const getSocketUrl = () => {
    // Hardcoded production URL as requested to avoid environment variable issues on Vercel/Render
    return 'https://digitalmenu-server.onrender.com';
};

const SOCKET_URL = getSocketUrl();

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                withCredentials: true,
                transports: ['polling', 'websocket'],
                path: '/socket.io/',
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            this.socket.on('connect', () => {
                console.log('Connected to socket server, id:', this.socket?.id);
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
        if (!this.socket) {
            console.warn('[SocketService] Attempted to join room before connection');
            return;
        }

        if (this.socket.connected) {
            this.socket.emit('join', room);
        } else {
            // Wait for connect event then join
            this.socket.once('connect', () => {
                this.socket?.emit('join', room);
            });
        }
    }

    on(event: string, callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event: string) {
        if (this.socket) {
            this.socket.off(event);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new SocketService();
