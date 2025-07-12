import { WebSocketServer, WebSocket } from 'ws';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from '@repo/backend-common/config';
import { prisma } from '@repo/database/client';
const PORT = parseInt(process.env.PORT || "8080", 10);
const wss = new WebSocketServer({ port: PORT });

interface User {
    ws: WebSocket
    rooms: string[]
    userId: string
}

const users: User[] = [];
if (!JWT_SECRET) {
    console.error("JWT_SECRET is not defined!");
    process.exit(1);
}
console.log("JWT_SECRET is defined");
function checkUser(token: string): string | null {
    try {
        console.log("Verifying token:", token.substring(0, 20) + "...");
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log("Token decoded successfully:", decoded);

        if (typeof decoded === 'string') {
            console.log("Token is string, rejecting");
            return null;
        }
        if (!(decoded as JwtPayload).userId) {
            console.log("No userId in token, rejecting");
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

wss.on('connection', function connection(ws, request) {
    console.log("New WebSocket connection attempt");
    
    const url = request.url;
    if (!url) {
        console.log("No URL provided, closing connection");
        ws.close();
        return;
    }
    
    console.log("Connection URL:", url);
    
    const params = new URLSearchParams(url.split('?')[1]);
    const token = params.get('token') || '';
    console.log("Extracted token:", token ? "Present" : "Missing");
    
    const userId = checkUser(token);
    console.log("User ID from token:", userId);
    
    if (userId == null) {
        console.log("Invalid token, closing connection");
        ws.close();
        return;
    }

    console.log("User authenticated successfully:", userId);
    
    users.push({
        userId,
        rooms: [],
        ws
    });

    console.log("Total connected users:", users.length);

    // Handle connection close
    ws.on('close', function close(code, reason) {
        console.log("WebSocket closed:", { code, reason: reason.toString() });
        removeUser(ws);
    });

    // Handle connection error
    ws.on('error', function error(err) {
        console.error('WebSocket error:', err);
        removeUser(ws);
    });

    ws.on('message', async function message(data) {
        let parsedData;
        if (typeof data !== "string") {
        parsedData = JSON.parse(data.toString());
        } else {
        parsedData = JSON.parse(data); // {type: "join-room", roomId: 1}
        }
        if (parsedData.type === "join_room") {
            const user = users.find(x => x.ws === ws);
            user?.rooms.push(parsedData.roomId);
        }

        if (parsedData.type === "leave_room") {
            const user = users.find(x => x.ws === ws);
            if (!user) {
                return;
            }

            user.rooms = user.rooms.filter(x => x !== parsedData.roomId);
        }

        if (parsedData.type === "chat") {
            const roomId = parsedData.roomId;
            const rawMessage = parsedData.message;
            const message = typeof rawMessage === "string"
            ? rawMessage
            : JSON.stringify(rawMessage); 

            await prisma.chat.create({
            data: {
                message,
                roomId: Number(roomId),
                userId
            }
            });


            users.forEach(user => {
                if (user.rooms.includes(roomId) && user.ws.readyState === WebSocket.OPEN) {
                    safeSend(user.ws, JSON.stringify({
                        type: "chat",
                        message,
                        roomId
                    }))
                }
            })
        }
    });

});