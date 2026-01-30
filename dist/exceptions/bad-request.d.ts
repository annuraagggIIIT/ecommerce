import { ErrorCode, HttpException } from './root.ts';
export declare class BadRequestException extends HttpException {
    constructor(message: string, errorCode: ErrorCode);
}
