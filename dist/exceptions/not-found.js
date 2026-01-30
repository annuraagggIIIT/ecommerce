import { HttpException } from './root.ts';
export class NotFoundException extends HttpException {
    constructor(message, errorCode) {
        super(message, errorCode, 404, null);
    }
}
