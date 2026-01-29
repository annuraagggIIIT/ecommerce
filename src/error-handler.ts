import type { NextFunction, Request, Response } from "express"
import { ca } from "zod/locales"
import { ErrorCode, HttpException } from "./exceptions/root.ts"
import { InternalException } from "./exceptions/internal-exception.ts"

export const errorHandler = (method: Function) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await method(req, res, next)
        }
        catch (error: any) {
            let exception: HttpException;
            if (error instanceof HttpException)
                exception = error;
            else {
                exception = new InternalException("Internal Server Error", error, ErrorCode.INRERNAL_EXCEPTION);
            }
            next(exception);
        }
    }
}