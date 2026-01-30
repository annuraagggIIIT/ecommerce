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
import { NotFoundException } from "../exceptions/not-found.ts";

export const signup = async (req: Request, res: Response, next: NextFunction) => {
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
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    let user = await prismaClient.user.findFirst({ where: { email } });
    if (!user) {
        throw new NotFoundException("User not found", ErrorCode.USER_NOT_FOUND);
    }
    if (!(compareSync(password, user.password))) {
        throw new BadRequestException("Invalid password", ErrorCode.INCORRECT_PASSWORD);
    }
    const token = jwt.sign({
        userId: user.id,
    }, JWT_SECRET)

    res.json({ user, token })
}

// /me returns the logged in user details
export const me = async (req: Request, res: Response) => {
    res.json({ user: req.user });
}