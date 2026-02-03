import type { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../exceptions/unauthorized.ts";
import { ErrorCode } from "../exceptions/root.ts";
import jwt from "jsonwebtoken"; //can be improved by custom algorithm
import { JWT_SECRET } from "../secrets.ts";
import { prismaClient } from "../db/prisma.ts";

export const authMiddleware = async(req: Request, res: Response, next: NextFunction) => {
    //1. Get the token from the Authorization header
    const token = req.headers.authorization;
    //2. If no token, return 401 Unauthorized
    if (!token) {
        next(new UnauthorizedException("No token provided", ErrorCode.UNAUTHORIZED));
        return;
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
        const user = await prismaClient.user.findFirst({ where: { id: payload.userId } });
        if (!user) {
            next(new UnauthorizedException("User not found", ErrorCode.UNAUTHORIZED));
            return;
        }
        req.user = user;
        next();
    }
    catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Invalid token";
        next(new UnauthorizedException(message, ErrorCode.UNAUTHORIZED));
    }

}
export default authMiddleware;