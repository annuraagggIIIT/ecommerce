import { expect } from "chai";
import sinon, { type SinonSandbox } from "sinon";
import { createMockRequest, createMockResponse, createMockNext } from "../setup.ts";
import { errorHandler } from "../../src/error-handler.ts";
import { HttpException, ErrorCode } from "../../src/exceptions/root.ts";
import { BadRequestException } from "../../src/exceptions/bad-request.ts";
import { InternalException } from "../../src/exceptions/internal-exception.ts";

describe("Error Handler", () => {
    let sandbox: SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("errorHandler wrapper", () => {
        it("should call the wrapped method successfully", async () => {
            const mockMethod = sandbox.stub().resolves();
            const wrappedMethod = errorHandler(mockMethod);
            const req = createMockRequest();
            const res = createMockResponse();
            const next = createMockNext();

            await wrappedMethod(req, res, next);

            expect(mockMethod.calledOnce).to.be.true;
            expect(next.called).to.be.false;
        });

        it("should pass HttpException to next when thrown", async () => {
            const error = new BadRequestException("Test error", ErrorCode.USER_ALREADY_EXISTS);
            const mockMethod = sandbox.stub().rejects(error);
            const wrappedMethod = errorHandler(mockMethod);
            const req = createMockRequest();
            const res = createMockResponse();
            const next = createMockNext();

            await wrappedMethod(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0]).to.be.instanceOf(BadRequestException);
            expect(next.firstCall.args[0].message).to.equal("Test error");
        });

        it("should wrap non-HttpException errors in InternalException", async () => {
            const error = new Error("Unexpected error");
            const mockMethod = sandbox.stub().rejects(error);
            const wrappedMethod = errorHandler(mockMethod);
            const req = createMockRequest();
            const res = createMockResponse();
            const next = createMockNext();

            await wrappedMethod(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0]).to.be.instanceOf(InternalException);
            expect(next.firstCall.args[0].statusCode).to.equal(500);
        });

        it("should preserve HttpException properties when re-throwing", async () => {
            const error = new HttpException("Custom error", ErrorCode.VALIDATION_ERROR, 422, { field: "test" });
            const mockMethod = sandbox.stub().rejects(error);
            const wrappedMethod = errorHandler(mockMethod);
            const req = createMockRequest();
            const res = createMockResponse();
            const next = createMockNext();

            await wrappedMethod(req, res, next);

            expect(next.calledOnce).to.be.true;
            const passedError = next.firstCall.args[0];
            expect(passedError.errorCode).to.equal(ErrorCode.VALIDATION_ERROR);
            expect(passedError.statusCode).to.equal(422);
            expect(passedError.errors).to.deep.equal({ field: "test" });
        });
    });
});
