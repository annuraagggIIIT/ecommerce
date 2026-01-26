import type { Request, Response } from "express";
import { prismaClient } from "../index.ts";
import {hashSync} from "bcrypt";
export const signup = async (req: Request, res: Response) => {
    const {email, password , name} = req.body;
    let user = await prismaClient.user.findFirst({ where: { email } });
    if (user) {
        return res.status(400).json({ message: "User already exists" });
    }
    user = await prismaClient.user.create({
        data:{name, email, password: hashSync(password, 10)}
    });
res.json(user)
}