import {z} from 'zod';

export const CreateUserSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters").max(20),
    name: z.string().min(2, "Name must be at least 2 characters")
})

export const SigninSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters").max(20),
})

export const CreateRoomSchema = z.object({
    name: z.string().min(3).max(20),
})