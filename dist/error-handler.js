import { ErrorCode, HttpException } from "./exceptions/root.ts";
import { InternalException } from "./exceptions/internal-exception.ts";
export const errorHandler = (method) => {
    return async (req, res, next) => {
        try {
            await method(req, res, next);
        }
        catch (error) {
            let exception;
            if (error instanceof HttpException)
                exception = error;
            else {
                exception = new InternalException("Internal Server Error", error, ErrorCode.INRERNAL_EXCEPTION);
            }
            next(exception);
        }
    };
};
