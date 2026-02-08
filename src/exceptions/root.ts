export class HttpException extends Error {
    message: string;
    errorCode: ErrorCode;
    statusCode: number;
    errors: any;

    constructor(message: string, errorCode: ErrorCode, statusCode: number, errors: any) {
        super(message);
        this.message = message;
        this.errorCode = errorCode;
        this.statusCode = statusCode;
        this.errors = errors;
    }
}
export enum ErrorCode {
USER_NOT_FOUND = '1001',
USER_ALREADY_EXISTS = '1002',
INCORRECT_PASSWORD = '1003',
VALIDATION_ERROR = '1004',
INRERNAL_EXCEPTION = '1005',
UNAUTHORIZED = '1006',
ADDRESS_NOT_FOUND = '2000',
ADDRESS_DOES_NOT_BELONG_TO_USER = '2002',
PRODUCT_NOT_FOUND = '2001',
FAILED_TO_ADD_ITEM_TO_CART = '3001',
CART_ITEM_NOT_FOUND = '3002',
ORDER_NOT_FOUND = '4001',
ORDER_ALREADY_CANCELLED = '4002',
CANNOT_CANCEL_ORDER = '4003',
}
