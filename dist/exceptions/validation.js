import { HttpException } from "./root.ts";
export class UnprocessableEntity extends HttpException {
    constructor(error, message, errorCode) {
        super(message, errorCode, 422, null);
    }
}
