import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

export const middleware = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers["authorization"]?.split(" ")[1] ?? ""
    const decoded = jwt.verify(token, JWT_SECRET)

    if (decoded) {
        if (typeof decoded === "string") {
            res.status(403).json({
                message:"You are not logged in"
            })
            return
        }
        req.userId = (decoded as JwtPayload).userId
        next()
    } else {
        res.status(401).json({ message: "Unauthorized" })
    }
}