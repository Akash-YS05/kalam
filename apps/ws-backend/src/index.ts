import { WebSocketServer, WebSocket } from 'ws';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from '@repo/backend-common/config';
import { prisma } from '@repo/database/client';
import Redis from 'ioredis';

const PORT = parseInt(process.env.PORT || "8080", 10);
const REDIS_URL = process.env.REDIS_URL;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const SERVER_ID = `${process.pid}-${Date.now()}`; // Unique identifier for this server instance

const wss = new WebSocketServer({ port: PORT });

// Redis clients for pub/sub (only if REDIS_URL is configured)
let pub: Redis | null = null;
let sub: Redis | null = null;
let redisEnabled = false;

if (REDIS_URL) {
    try {
        pub = new Redis(REDIS_URL);
        sub = new Redis(REDIS_URL);
        redisEnabled = true;
        
        sub.subscribe('room_messages', (err) => {
            if (err) {
                console.error('Redis subscribe error:', err);
                redisEnabled = false;
            } else {
                console.log('Redis pub/sub enabled for horizontal scaling');
            }
        });

        sub.on('message', (channel, message) => {
            if (channel === 'room_messages') {
                try {
                    const { roomId, data, sourceServerId } = JSON.parse(message);
                    
                    // Don't echo messages from this server back to its own clients
                    if (sourceServerId === SERVER_ID) return;
                    
                    // Broadcast to local clients in this room
                    users.forEach(user => {
                        if (user.rooms.includes(roomId) && user.ws.readyState === WebSocket.OPEN) {
                            safeSend(user.ws, data);
                        }
                    });
                } catch (e) {
                    console.error('Error processing Redis message:', e);
                }
            }
        });

        pub.on('error', (err) => {
            console.error('Redis pub error:', err);
        });

        sub.on('error', (err) => {
            console.error('Redis sub error:', err);
        });
    } catch (e) {
        console.error('Failed to connect to Redis:', e);
        redisEnabled = false;
    }
} else {
    console.log('Redis not configured. Running in single-server mode.');
}

// Extended WebSocket type with custom properties
interface ExtendedWebSocket extends WebSocket {
    isAlive: boolean;
    userId: string;
    rooms: string[];
}

interface User {
    ws: ExtendedWebSocket
    rooms: string[]
    userId: string
}

const users: User[] = [];

// Heartbeat interval to detect stale connections
const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
        const extWs = ws as ExtendedWebSocket;
        if (extWs.isAlive === false) {
            console.log("Terminating stale connection for user:", extWs.userId);
            removeUser(extWs);
            return extWs.terminate();
        }
        extWs.isAlive = false;
        extWs.ping();
    });
}, HEARTBEAT_INTERVAL);

wss.on('close', () => {
    clearInterval(heartbeatInterval);
    if (pub) pub.quit();
    if (sub) sub.quit();
});

if (!JWT_SECRET) {
    console.error("JWT_SECRET is not defined!");
    process.exit(1);
}

console.log(`WebSocket server starting on port ${PORT} (Server ID: ${SERVER_ID})`);

function checkUser(token: string): string | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (typeof decoded === 'string') {
            return null;
        }
        if (!(decoded as JwtPayload).userId) {
            return null;
        }

        return (decoded as JwtPayload).userId;
    } catch(e) {
        console.error("JWT verification error:", e);
        return null;
    }
}


function safeSend(ws: WebSocket, data: string): boolean {
    if (ws.readyState === WebSocket.OPEN) {
        try {
            ws.send(data);
            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            return false;
        }
    }
    return false;
}

// Helper function to remove user from users array
function removeUser(ws: WebSocket) {
    const index = users.findIndex(user => user.ws === ws);
    if (index !== -1) {
        users.splice(index, 1);
    }
}

// Broadcast to room - handles both local and Redis pub/sub
async function broadcastToRoom(roomId: string, message: string) {
    const outMessage = JSON.stringify({
        type: "chat",
        message,
        roomId
    });

    // Broadcast to local clients
    users.forEach(user => {
        if (user.rooms.includes(roomId) && user.ws.readyState === WebSocket.OPEN) {
            safeSend(user.ws, outMessage);
        }
    });

    // Publish to Redis for other server instances
    if (redisEnabled && pub) {
        try {
            await pub.publish('room_messages', JSON.stringify({
                roomId,
                data: outMessage,
                sourceServerId: SERVER_ID
            }));
        } catch (e) {
            console.error('Error publishing to Redis:', e);
        }
    }
}

wss.on('connection', function connection(ws, request) {
    const extWs = ws as ExtendedWebSocket;
    
    // Initialize heartbeat
    extWs.isAlive = true;
    extWs.rooms = [];
    
    // Handle pong response for heartbeat
    extWs.on('pong', () => {
        extWs.isAlive = true;
    });
    
    const url = request.url;
    if (!url) {
        ws.close();
        return;
    }
    
    const params = new URLSearchParams(url.split('?')[1]);
    const token = params.get('token') || '';
    
    const userId = checkUser(token);
    
    if (userId == null) {
        ws.close();
        return;
    }

    extWs.userId = userId;
    
    users.push({
        userId,
        rooms: [],
        ws: extWs
    });

    console.log(`User ${userId} connected. Total users: ${users.length}`);

    // Handle connection close
    extWs.on('close', function close(code, reason) {
        console.log(`User ${userId} disconnected. Code: ${code}`);
        removeUser(extWs);
    });

    // Handle connection error
    extWs.on('error', function error(err) {
        console.error('WebSocket error:', err);
        removeUser(extWs);
    });

    extWs.on('message', async function message(data) {
        let parsedData;
        try {
            if (typeof data !== "string") {
                parsedData = JSON.parse(data.toString());
            } else {
                parsedData = JSON.parse(data);
            }
        } catch (e) {
            console.error('Invalid JSON message:', e);
            return;
        }

        if (parsedData.type === "join_room") {
            const user = users.find(x => x.ws === extWs);
            if (user && !user.rooms.includes(parsedData.roomId)) {
                user.rooms.push(parsedData.roomId);
                console.log(`User ${userId} joined room ${parsedData.roomId}`);
            }
        }

        if (parsedData.type === "leave_room") {
            const user = users.find(x => x.ws === extWs);
            if (!user) return;

            user.rooms = user.rooms.filter(x => x !== parsedData.roomId);
            console.log(`User ${userId} left room ${parsedData.roomId}`);
        }

        if (parsedData.type === "chat") {
            const roomId = parsedData.roomId;
            const rawMessage = parsedData.message;
            const message = typeof rawMessage === "string"
                ? rawMessage
                : JSON.stringify(rawMessage); 

            // Save to database
            try {
                await prisma.chat.create({
                    data: {
                        message,
                        roomId: Number(roomId),
                        userId
                    }
                });
            } catch (e) {
                console.error('Error saving chat to database:', e);
            }

            // Broadcast to all clients in the room (including Redis pub/sub)
            await broadcastToRoom(roomId, message);
        }
    });
});

console.log(`WebSocket server is running on port ${PORT}`);
