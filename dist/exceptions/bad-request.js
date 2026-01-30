import { HttpException } from './root.ts';
export class BadRequestException extends HttpException {
    constructor(message, errorCode) {
        super(message, errorCode, 400, null);
    }
}
