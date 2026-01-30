import { HttpException } from "./root.ts";
export class InternalException extends HttpException {
    constructor(message, errors, errorCode) {
        super(message, errorCode, 500, errors);
    }
}
