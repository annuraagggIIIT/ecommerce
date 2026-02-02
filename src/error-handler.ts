import type { NextFunction, Request, Response } from "express"
import { ErrorCode, HttpException } from "./exceptions/root.ts"
import { InternalException } from "./exceptions/internal-exception.ts"
import { ZodError } from "zod"

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
                if(error instanceof ZodError)
                {
                    exception = new InternalException("Validation Error", error, ErrorCode.VALIDATION_ERROR);
                }
                else{
                exception = new InternalException("Internal Server Error", error, ErrorCode.INRERNAL_EXCEPTION);
                }
            }
            next(exception);
        }
    }
}