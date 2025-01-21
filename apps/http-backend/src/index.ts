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
app.use(cors())

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
                email: parsedData.data.username,
                password: hashedPassword,
                name: parsedData.data.name
            }
        })
        res.json({
            userId: user.id
        })
    } catch(e) {
        res.status(411).json({ message: "Something went wrong" })
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
                email: parsedData.data.username
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
        res.status(411).json({ message: "Something went wrong" })
    } 
    
})

app.post("/room", middleware, async(req, res) => {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({ message: "Invalid data" })
        return;
    }

    const userId = req.userId || "";

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
        res.status(411).json({ message: "Something went wrong" })
    }

})

app.get("/chats/:roomId", middleware, async(req, res) => {
    try {
        const roomId = Number(req.params.roomId);
        const messages = await prisma.chat.findMany({
            where: {
                roomId: roomId
            },
            orderBy: {
                id: "desc"
            },
            take: 50
        })

        res.json({messages})
    } catch(e) {
        console.log(e);
        
        res.json({ messages: [] })
    }
})

app.get("/room/:slug", middleware, async(req, res) => {
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

app.listen(3001)