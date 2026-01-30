import { expect } from "chai";
import { HttpException, ErrorCode } from "../../../src/exceptions/root.ts";
import { BadRequestException } from "../../../src/exceptions/bad-request.ts";
import { NotFoundException } from "../../../src/exceptions/not-found.ts";
import { UnauthorizedException } from "../../../src/exceptions/unauthorized.ts";
import { InternalException } from "../../../src/exceptions/internal-exception.ts";
import { UnprocessableEntity } from "../../../src/exceptions/validation.ts";

describe("Exception Classes", () => {
    describe("HttpException", () => {
        it("should create HttpException with correct properties", () => {
            const exception = new HttpException("Test error", ErrorCode.USER_NOT_FOUND, 400, { detail: "test" });

            expect(exception.message).to.equal("Test error");
            expect(exception.errorCode).to.equal(ErrorCode.USER_NOT_FOUND);
            expect(exception.statusCode).to.equal(400);
            expect(exception.errors).to.deep.equal({ detail: "test" });
            expect(exception).to.be.instanceOf(Error);
        });
    });

    describe("BadRequestException", () => {
        it("should create BadRequestException with status 400", () => {
            const exception = new BadRequestException("Bad request", ErrorCode.USER_ALREADY_EXISTS);

            expect(exception.message).to.equal("Bad request");
            expect(exception.errorCode).to.equal(ErrorCode.USER_ALREADY_EXISTS);
            expect(exception.statusCode).to.equal(400);
            expect(exception.errors).to.be.null;
            expect(exception).to.be.instanceOf(HttpException);
        });
    });

    describe("NotFoundException", () => {
        it("should create NotFoundException with status 404", () => {
            const exception = new NotFoundException("Not found", ErrorCode.USER_NOT_FOUND);

            expect(exception.message).to.equal("Not found");
            expect(exception.errorCode).to.equal(ErrorCode.USER_NOT_FOUND);
            expect(exception.statusCode).to.equal(404);
            expect(exception.errors).to.be.null;
            expect(exception).to.be.instanceOf(HttpException);
        });
    });

    describe("UnauthorizedException", () => {
        it("should create UnauthorizedException with status 401", () => {
            const exception = new UnauthorizedException("Unauthorized", ErrorCode.UNAUTHORIZED);

            expect(exception.message).to.equal("Unauthorized");
            expect(exception.errorCode).to.equal(ErrorCode.UNAUTHORIZED);
            expect(exception.statusCode).to.equal(401);
            expect(exception.errors).to.be.null;
            expect(exception).to.be.instanceOf(HttpException);
        });
    });

    describe("InternalException", () => {
        it("should create InternalException with status 500", () => {
            const originalError = new Error("Original error");
            const exception = new InternalException("Internal error", originalError, ErrorCode.INRERNAL_EXCEPTION);

            expect(exception.message).to.equal("Internal error");
            expect(exception.errorCode).to.equal(ErrorCode.INRERNAL_EXCEPTION);
            expect(exception.statusCode).to.equal(500);
            expect(exception.errors).to.equal(originalError);
            expect(exception).to.be.instanceOf(HttpException);
        });
    });

    describe("UnprocessableEntity", () => {
        it("should create UnprocessableEntity with status 422", () => {
            const validationErrors = { email: "Invalid email" };
            const exception = new UnprocessableEntity(validationErrors, "Validation failed", ErrorCode.VALIDATION_ERROR);

            expect(exception.message).to.equal("Validation failed");
            expect(exception.errorCode).to.equal(ErrorCode.VALIDATION_ERROR);
            expect(exception.statusCode).to.equal(422);
            expect(exception).to.be.instanceOf(HttpException);
        });
    });

    describe("ErrorCode enum", () => {
        it("should have correct error codes", () => {
            expect(ErrorCode.USER_NOT_FOUND).to.equal("1001");
            expect(ErrorCode.USER_ALREADY_EXISTS).to.equal("1002");
            expect(ErrorCode.INCORRECT_PASSWORD).to.equal("1003");
            expect(ErrorCode.VALIDATION_ERROR).to.equal("1004");
            expect(ErrorCode.INRERNAL_EXCEPTION).to.equal("1005");
            expect(ErrorCode.UNAUTHORIZED).to.equal("1006");
        });
    });
});
