import type { NextFunction, Request, Response } from "express";
import { prismaClient } from "../index.ts";
import { hashSync, compareSync } from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../secrets.ts";
import { BadRequestException } from "../exceptions/bad-request.ts";
import { ErrorCode } from "../exceptions/root.ts";
import { ca } from "zod/locales";
import { UnprocessableEntity } from "../exceptions/validation.ts";
import { SignUpSchema } from "../schema/user.ts";

export const signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        SignUpSchema.parse(req.body);
        const { email, password, name } = req.body;
        let user = await prismaClient.user.findFirst({ where: { email } });
        if (user) {
            next(new BadRequestException("User already exists", ErrorCode.USER_ALREADY_EXISTS));
        }
        user = await prismaClient.user.create({
            data: { name, email, password: hashSync(password, 10) }
        });
        res.json(user)
    }
    catch (err: any) {
        next(new UnprocessableEntity(err?.issues, "unprocessable entity", ErrorCode.VALIDATION_ERROR));
    }

}
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    let user = await prismaClient.user.findFirst({ where: { email } });
    if (!user) {
        return res.status(400).json({ message: "User does not exists" });
    }
    if (!(compareSync(password, user.password))) {

        throw new Error("Invalid password")
    }
    const token = jwt.sign({
        userId: user.id,
    }, JWT_SECRET)

    res.json({ user, token })
}