import { expect } from "chai";
import sinon, { type SinonSandbox } from "sinon";
import { createMockRequest, createMockResponse, createMockNext } from "../../setup.ts";
import { errorMiddleware } from "../../../src/middlewares/errors.ts";
import { HttpException, ErrorCode } from "../../../src/exceptions/root.ts";
import { BadRequestException } from "../../../src/exceptions/bad-request.ts";
import { NotFoundException } from "../../../src/exceptions/not-found.ts";
import { UnauthorizedException } from "../../../src/exceptions/unauthorized.ts";

describe("Error Middleware", () => {
    let sandbox: SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("errorMiddleware", () => {
        it("should return correct response for BadRequestException", () => {
            const error = new BadRequestException("Bad request", ErrorCode.USER_ALREADY_EXISTS);
            const req = createMockRequest();
            const res = createMockResponse();
            const next = createMockNext();

            errorMiddleware(error, req, res, next);

            expect(res.status.calledWith(400)).to.be.true;
            expect(res.json.calledOnce).to.be.true;
            const response = res.json.firstCall.args[0];
            expect(response.message).to.equal("Bad request");
            expect(response.errorCode).to.equal(ErrorCode.USER_ALREADY_EXISTS);
        });

        it("should return correct response for NotFoundException", () => {
            const error = new NotFoundException("Not found", ErrorCode.USER_NOT_FOUND);
            const req = createMockRequest();
            const res = createMockResponse();
            const next = createMockNext();

            errorMiddleware(error, req, res, next);

            expect(res.status.calledWith(404)).to.be.true;
            expect(res.json.calledOnce).to.be.true;
            const response = res.json.firstCall.args[0];
            expect(response.message).to.equal("Not found");
            expect(response.errorCode).to.equal(ErrorCode.USER_NOT_FOUND);
        });

        it("should return correct response for UnauthorizedException", () => {
            const error = new UnauthorizedException("Unauthorized", ErrorCode.UNAUTHORIZED);
            const req = createMockRequest();
            const res = createMockResponse();
            const next = createMockNext();

            errorMiddleware(error, req, res, next);

            expect(res.status.calledWith(401)).to.be.true;
            expect(res.json.calledOnce).to.be.true;
            const response = res.json.firstCall.args[0];
            expect(response.message).to.equal("Unauthorized");
            expect(response.errorCode).to.equal(ErrorCode.UNAUTHORIZED);
        });

        it("should include errors in response when present", () => {
            const error = new HttpException("Error with details", ErrorCode.VALIDATION_ERROR, 422, { field: "email" });
            const req = createMockRequest();
            const res = createMockResponse();
            const next = createMockNext();

            errorMiddleware(error, req, res, next);

            expect(res.status.calledWith(422)).to.be.true;
            const response = res.json.firstCall.args[0];
            expect(response.errors).to.deep.equal({ field: "email" });
        });
    });
});
