import type { Request, Response } from "express";
import { SignUpSchema } from "../schema/user.ts";
import * as authService from "../services/auth.service.ts";

export const signup = async (req: Request, res: Response) => {
    SignUpSchema.parse(req.body);
    const { name, email, password, role } = req.body;
    const user = await authService.signupUser(name, email, password, role);
    res.json(user);
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.json(result);
};

export const me = async (req: Request, res: Response) => {
    res.json({ user: req.user });
};
