import express from 'express';
import { middleware } from './middleware';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import {CreateUserSchema, SigninSchema, CreateRoomSchema } from '@repo/common/types';
import { prisma } from '@repo/database/client';
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
        res.json({ message: "Invalid data" })
        return;
    } 
    try {
        const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);
        const user = await prisma.user.create({
            data: {
                email: parsedData.data.email,
                password: hashedPassword,
                name: parsedData.data.name
            }
        })
        res.json({
            userId: user.id
        })
    } catch(e) {
        res.status(500).json({ message: "Something went wrong" })
    }
})

app.post("/signin", async(req, res) => {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({ message: "Invalid data" })
        return;
    }
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: parsedData.data.email
            }
        })
        if (!user) {
            res.json({ message: "Invalid credentials" })
            return;
        }
        const isValid = await bcrypt.compare(parsedData.data.password, user.password);
        if (!isValid) {
            res.json({ message: "Invalid credentials" })
            return;
        }
        const token = jwt.sign({
            userId: user?.id
        }, JWT_SECRET)

        res.json({ token })

    } catch(e) {
        res.status(500).json({ message: "Something went wrong" })
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

    try {
        const rooms = await prisma.room.findMany({
            where: {
                adminId: userId
            }
        });
        res.json({ rooms });
    } catch (e) {
        console.error("Error fetching rooms:", e);
        res.status(500).json({ message: "Something went wrong" });
    }
})

app.get("/chats/:roomId", async(req, res) => {
    try {
        const roomId = Number(req.params.roomId);
        const messages = await prisma.chat.findMany({
            where: {
                roomId: roomId
            },
            orderBy: {
                id: "desc"
            },
            take: 1000
        })

        res.json({messages})
    } catch(e) {
        console.log(e);
        res.json({ messages: [] })
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

app.listen(PORT)