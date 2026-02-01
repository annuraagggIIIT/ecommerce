import { expect } from "chai";
import sinon, { type SinonSandbox, type SinonStub } from "sinon";
import type { Request, Response, NextFunction } from "express";
import { adminMiddleware } from "../../../src/middlewares/admin.ts";
import { UnauthorizedException } from "../../../src/exceptions/unauthorized.ts";
import { ErrorCode } from "../../../src/exceptions/root.ts";

const createMockRequest = (overrides: any = {}): Partial<Request> => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides
});

const createMockResponse = (): Partial<Response> => {
    const res: any = {};
    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    res.send = sinon.stub().returns(res);
    return res;
};

const createMockNext = (): SinonStub => sinon.stub();

describe("Admin Middleware Unit Tests", () => {
    let sandbox: SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("adminMiddleware", () => {
        it("should call next() when user is admin", async () => {
            const req = createMockRequest({
                user: { id: 1, name: "Admin", email: "admin@test.com", role: "ADMIN" }
            }) as Request;
            const res = createMockResponse() as Response;
            const next = createMockNext();

            await adminMiddleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args).to.be.empty;
        });

        it("should call next with UnauthorizedException when user is not admin", async () => {
            const req = createMockRequest({
                user: { id: 1, name: "User", email: "user@test.com", role: "USER" }
            }) as Request;
            const res = createMockResponse() as Response;
            const next = createMockNext();

            await adminMiddleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0]).to.be.instanceOf(UnauthorizedException);
            expect(next.firstCall.args[0].message).to.equal("Unauthorized: Admins only");
        });

        it("should call next with UnauthorizedException when user is undefined", async () => {
            const req = createMockRequest({}) as Request;
            const res = createMockResponse() as Response;
            const next = createMockNext();

            await adminMiddleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0]).to.be.instanceOf(UnauthorizedException);
        });

        it("should call next with UnauthorizedException when user has no role", async () => {
            const req = createMockRequest({
                user: { id: 1, name: "User", email: "user@test.com" }
            }) as Request;
            const res = createMockResponse() as Response;
            const next = createMockNext();

            await adminMiddleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0]).to.be.instanceOf(UnauthorizedException);
            expect(next.firstCall.args[0].errorCode).to.equal(ErrorCode.UNAUTHORIZED);
        });
    });
});
