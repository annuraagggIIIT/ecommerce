import { ErrorCode, HttpException } from "./root.ts";
export declare class InternalException extends HttpException {
    constructor(message: string, errors: any, errorCode: ErrorCode);
}
