import type { NextFunction, Request, Response } from "express";
export declare const errorHandler: (method: Function) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
