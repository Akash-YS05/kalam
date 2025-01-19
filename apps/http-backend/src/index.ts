import express from 'express';
import { middleware } from './middleware';
import {CreateUserSchema, SigninSchema, CreateRoomSchema } from '@repo/common/types'

const app = express()

app.post("/signup", (req, res) => {
    const data = CreateUserSchema.safeParse(req.body);
    if (!data.success) {
        res.json({ message: "Invalid data" })
        return;
    } 
    
})
app.post("/signin", (req, res) => {
    const data = SigninSchema.safeParse(req.body);
    if (!data.success) {
        res.json({ message: "Invalid data" })
        return;
    }
    
})
app.post("/room", middleware, (req, res) => {
    const data = CreateRoomSchema.safeParse(req.body);
    if (!data.success) {
        res.json({ message: "Invalid data" })
        return;
    }

})

app.listen(3001)