import { prismaClient } from "../db/prisma.ts";
import { hashSync, compareSync } from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../secrets.ts";
import { BadRequestException } from "../exceptions/bad-request.ts";
import { NotFoundException } from "../exceptions/not-found.ts";
import { ErrorCode } from "../exceptions/root.ts";
import { TALLY_STATUS } from "../integrations/tally/tally.status.ts";
import { enqueueUserSync } from "../integrations/tally/index.ts";

export const signupUser = async (name: string, email: string, password: string, role: string) => {
    const existing = await prismaClient.user.findFirst({ where: { email } });
    if (existing) {
        throw new BadRequestException("User already exists", ErrorCode.USER_ALREADY_EXISTS);
    }
    const user = await prismaClient.user.create({
        data: { name, email, password: hashSync(password, 10), role: role as any, tallyStatus: TALLY_STATUS.USER_NEW }
    });
    try {
        await enqueueUserSync(user.id, "Create");
    } catch {
        // Queue failure must not break signup
    }
    return user;
};

export const loginUser = async (email: string, password: string) => {
    const user = await prismaClient.user.findFirst({ where: { email } });
    if (!user) {
        throw new NotFoundException("User not found", ErrorCode.USER_NOT_FOUND);
    }
    if (!compareSync(password, user.password)) {
        throw new BadRequestException("Invalid password", ErrorCode.INCORRECT_PASSWORD);
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    return { user, token };
};
