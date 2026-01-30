export class HttpException extends Error {
    message;
    errorCode;
    statusCode;
    errors;
    constructor(message, errorCode, statusCode, errors) {
        super(message);
        this.message = message;
        this.errorCode = errorCode;
        this.statusCode = statusCode;
        this.errors = errors;
    }
}
export var ErrorCode;
(function (ErrorCode) {
    ErrorCode["USER_NOT_FOUND"] = "1001";
    ErrorCode["USER_ALREADY_EXISTS"] = "1002";
    ErrorCode["INCORRECT_PASSWORD"] = "1003";
    ErrorCode["VALIDATION_ERROR"] = "1004";
    ErrorCode["INRERNAL_EXCEPTION"] = "1005";
    ErrorCode["UNAUTHORIZED"] = "1006";
})(ErrorCode || (ErrorCode = {}));
