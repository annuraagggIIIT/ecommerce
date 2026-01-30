import { UnauthorizedException } from "../exceptions/unauthorized.ts";
import { ErrorCode } from "../exceptions/root.ts";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../secrets.ts";
import { prismaClient } from "../index.ts";
export const authMiddleware = async (req, res, next) => {
    //1. Get the token from the Authorization header
    const token = req.headers.authorization;
    //2. If no token, return 401 Unauthorized
    if (!token) {
        next(new UnauthorizedException("No token provided", ErrorCode.UNAUTHORIZED));
        return;
    }
    try {
        //3. If token is present, verify it
        const payload = jwt.verify(token, JWT_SECRET);
        //4. get the user from the database/payload
        const user = await prismaClient.user.findFirst({ where: { id: payload.userId } });
        if (!user) {
            next(new UnauthorizedException("User not found", ErrorCode.UNAUTHORIZED));
            return;
        }
        //5. attach the user to the request object
        req.user = user;
        next();
    }
    catch (error) {
        next(new UnauthorizedException("Invalid token", ErrorCode.UNAUTHORIZED));
    }
};
export default authMiddleware;
