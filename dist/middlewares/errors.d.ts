import type { NextFunction, Request, Response } from "express";
import type { HttpException } from "../exceptions/root.ts";
export declare const errorMiddleware: (error: HttpException, req: Request, res: Response, next: NextFunction) => void;
