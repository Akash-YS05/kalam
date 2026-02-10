import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

// Re-export Prisma types for use in other packages
export { Prisma } from "@prisma/client";