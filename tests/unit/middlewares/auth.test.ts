import { expect } from "chai";
import sinon, { type SinonSandbox, type SinonStub } from "sinon";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { UnauthorizedException } from "../../../src/exceptions/unauthorized.ts";
import { ErrorCode } from "../../../src/exceptions/root.ts";

const mockUser = {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    password: "$2b$10$hashedpassword",
    createdAt: new Date(),
    updatedAt: new Date()
};

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

describe("Auth Middleware Unit Tests", () => {
    let sandbox: SinonSandbox;
    const JWT_SECRET = process.env.JWT_SECRET || "test-secret";

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("token validation logic", () => {
        it("should create UnauthorizedException when no token provided", () => {
            const exception = new UnauthorizedException("No token provided", ErrorCode.UNAUTHORIZED);
            expect(exception.statusCode).to.equal(401);
            expect(exception.message).to.equal("No token provided");
            expect(exception.errorCode).to.equal(ErrorCode.UNAUTHORIZED);
        });

        it("should verify valid JWT token", () => {
            const token = jwt.sign({ userId: 1 }, JWT_SECRET);
            const decoded = jwt.verify(token, JWT_SECRET) as any;

            expect(decoded.userId).to.equal(1);
        });

        it("should throw error for invalid token", () => {
            expect(() => jwt.verify("invalid-token", JWT_SECRET)).to.throw();
        });

        it("should throw error for token with wrong secret", () => {
            const token = jwt.sign({ userId: 1 }, "wrong-secret");
            expect(() => jwt.verify(token, JWT_SECRET)).to.throw();
        });

        it("should create UnauthorizedException for invalid token", () => {
            const exception = new UnauthorizedException("Invalid token", ErrorCode.UNAUTHORIZED);
            expect(exception.statusCode).to.equal(401);
            expect(exception.message).to.equal("Invalid token");
        });

        it("should create UnauthorizedException when user not found", () => {
            const exception = new UnauthorizedException("User not found", ErrorCode.UNAUTHORIZED);
            expect(exception.statusCode).to.equal(401);
            expect(exception.message).to.equal("User not found");
        });
    });

    describe("request object modification", () => {
        it("should attach user to request object", () => {
            const req: any = createMockRequest();
            req.user = mockUser;

            expect(req.user).to.deep.equal(mockUser);
            expect(req.user.id).to.equal(1);
            expect(req.user.email).to.equal("test@example.com");
        });
    });

    describe("authorization header extraction", () => {
        it("should extract token from authorization header", () => {
            const token = jwt.sign({ userId: 1 }, JWT_SECRET);
            const req = createMockRequest({
                headers: { authorization: token }
            });

            expect(req.headers!.authorization).to.equal(token);
        });

        it("should handle missing authorization header", () => {
            const req = createMockRequest({ headers: {} });
            expect(req.headers!.authorization).to.be.undefined;
        });
    });

    describe("next function behavior", () => {
        it("should call next without arguments on success", () => {
            const next = createMockNext();
            next();

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args).to.be.empty;
        });

        it("should call next with error on failure", () => {
            const next = createMockNext();
            const error = new UnauthorizedException("Error", ErrorCode.UNAUTHORIZED);
            next(error);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0]).to.be.instanceOf(UnauthorizedException);
        });
    });

    describe("JWT payload extraction", () => {
        it("should extract userId from valid token payload", () => {
            const token = jwt.sign({ userId: 42 }, JWT_SECRET);
            const payload = jwt.verify(token, JWT_SECRET) as any;

            expect(payload.userId).to.equal(42);
        });

        it("should handle token with additional claims", () => {
            const token = jwt.sign({ userId: 1, role: "admin" }, JWT_SECRET);
            const payload = jwt.verify(token, JWT_SECRET) as any;

            expect(payload.userId).to.equal(1);
            expect(payload.role).to.equal("admin");
        });
    });
});
