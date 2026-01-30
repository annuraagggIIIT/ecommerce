export declare class HttpException extends Error {
    message: string;
    errorCode: ErrorCode;
    statusCode: number;
    errors: any;
    constructor(message: string, errorCode: ErrorCode, statusCode: number, errors: any);
}
export declare enum ErrorCode {
    USER_NOT_FOUND = "1001",
    USER_ALREADY_EXISTS = "1002",
    INCORRECT_PASSWORD = "1003",
    VALIDATION_ERROR = "1004",
    INRERNAL_EXCEPTION = "1005",
    UNAUTHORIZED = "1006"
}
