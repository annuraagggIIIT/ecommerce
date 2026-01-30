import { ErrorCode, HttpException } from "./root.ts";
export declare class UnprocessableEntity extends HttpException {
    constructor(error: any, message: string, errorCode: ErrorCode);
}
