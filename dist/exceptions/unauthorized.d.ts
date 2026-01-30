import { ErrorCode, HttpException } from './root.ts';
export declare class UnauthorizedException extends HttpException {
    constructor(message: string, errorCode: ErrorCode);
}
