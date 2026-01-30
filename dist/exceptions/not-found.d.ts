import { ErrorCode, HttpException } from './root.ts';
export declare class NotFoundException extends HttpException {
    constructor(message: string, errorCode: ErrorCode);
}
