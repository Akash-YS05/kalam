import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

export const middleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const token = req.headers["authorization"]?.split(" ")[1];
        
        if (!token) {
            res.status(401).json({
                message: "No token provided"
            });
            return;
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        if (typeof decoded === "string") {
            res.status(403).json({
                message: "Invalid token format"
            });
            return;
        }

        req.userId = (decoded as JwtPayload).userId;
        next();
        
    } catch (error) {
        // This catches JWT verification errors (expired, invalid, etc.)
        res.status(401).json({ 
            message: "Invalid or expired token" 
        });
        return;
    }
}