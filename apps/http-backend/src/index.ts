import express from 'express';
import { middleware } from './middleware';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import {CreateUserSchema, SigninSchema, CreateRoomSchema } from '@repo/common/types';
import { prisma, Prisma } from '@repo/database/client';
import { JWT_SECRET } from '@repo/backend-common/config';

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true}))

const allowedOrigins = ["http://localhost:3000", "https://kalamm.vercel.app"];

const corsOptions = {
    //@ts-ignore
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200 
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

// Rest of your routes...
app.get("/", (req, res) => {
    res.send("KALAM HTTP BACKEND")
})

app.post("/signup", async(req, res) => {
    const parsedData = CreateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({ 
            message: "Invalid data",
            errors: parsedData.error.errors.map(e => e.message)
        });
        return;
    } 
    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: parsedData.data.email }
        });

        if (existingUser) {
            res.status(409).json({ message: "An account with this email already exists" });
            return;
        }

        const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);
        const user = await prisma.user.create({
            data: {
                email: parsedData.data.email,
                password: hashedPassword,
                name: parsedData.data.name
            }
        });

        res.status(201).json({
            userId: user.id,
            message: "Account created successfully"
        });
    } catch(e) {
        console.error("Signup error:", e);
        
        // Handle Prisma unique constraint error (backup check)
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code === 'P2002') {
                res.status(409).json({ message: "An account with this email already exists" });
                return;
            }
        }
        
        res.status(500).json({ message: "Something went wrong during signup" });
    }
})

app.post("/signin", async(req, res) => {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({ 
            message: "Invalid data",
            errors: parsedData.error.errors.map(e => e.message)
        });
        return;
    }
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: parsedData.data.email
            }
        });

        if (!user) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }

        // Check if user signed up via OAuth (no password)
        if (!user.password) {
            res.status(401).json({ message: "Please sign in with Google" });
            return;
        }

        const isValid = await bcrypt.compare(parsedData.data.password, user.password);
        if (!isValid) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }

        const token = jwt.sign({
            userId: user.id
        }, JWT_SECRET);

        res.json({ 
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });

    } catch(e) {
        console.error("Signin error:", e);
        res.status(500).json({ message: "Something went wrong during signin" });
    } 
})

app.post("/room",  middleware, async(req, res) => {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({ message: "Invalid data" })
        return;
    }

    const userId = req.userId || "";

    if (!userId) {
        res.status(400).json({ message: "Invalid or missing userId" });
        return;
    }

    try {
        const room = await prisma.room.create({
            data: {
                slug: parsedData.data.name,
                adminId: userId
            }
        })

        res.json({
            roomId: room.id
        })

    } catch(e) {
        console.log(e);
        res.status(411).json({ message: "Something went wrong" })
    }
})

app.get("/room", middleware, async (req, res) => {
    const userId = req.userId;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    try {
        const [rooms, total] = await Promise.all([
            prisma.room.findMany({
                where: { adminId: userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: skip
            }),
            prisma.room.count({ where: { adminId: userId } })
        ]);

        res.json({
            rooms,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (e) {
        console.error("Error fetching rooms:", e);
        res.status(500).json({ message: "Something went wrong" });
    }
})

app.delete("/room/:id", middleware, async (req, res) => {
    const userId = req.userId;
    const roomId = Number(req.params.id);

    if (isNaN(roomId)) {
        res.status(400).json({ message: "Invalid room ID" });
        return;
    }

    try {
        // Verify ownership
        const room = await prisma.room.findFirst({
            where: { id: roomId, adminId: userId }
        });

        if (!room) {
            res.status(404).json({ message: "Room not found or not authorized" });
            return;
        }

        // Delete chats first, then room
        await prisma.chat.deleteMany({ where: { roomId } });
        await prisma.room.delete({ where: { id: roomId } });

        res.json({ message: "Room deleted successfully" });
    } catch (e) {
        console.error("Error deleting room:", e);
        res.status(500).json({ message: "Something went wrong" });
    }
})

app.get("/chats/:roomId", middleware, async (req, res) => {
    try {
        const roomId = Number(req.params.roomId);
        
        if (isNaN(roomId)) {
            res.status(400).json({ message: "Invalid room ID" });
            return;
        }

        const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
        const limit = Math.min(500, Math.max(1, parseInt(req.query.limit as string) || 200));

        const messages = await prisma.chat.findMany({
            where: { roomId },
            orderBy: { id: 'asc' },
            take: limit,
            ...(cursor && { skip: 1, cursor: { id: cursor } })
        });

        res.json({
            messages,
            nextCursor: messages.length === limit ? messages[messages.length - 1]?.id : null
        });
    } catch (e) {
        console.error("Error fetching chats:", e);
        res.status(500).json({ messages: [], nextCursor: null });
    }
})

app.get("/room/:slug", async(req, res) => {
    try {
        const slug = req.params.slug;
        const room = await prisma.room.findFirst({
            where: {
                slug
            }
        })

        res.json({
            room
        })
    } catch(e) {
        console.log(e);
        res.json({message: "Something went wrong"})
    }
})

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
    console.log(`HTTP Backend is running on port ${PORT}`);
});