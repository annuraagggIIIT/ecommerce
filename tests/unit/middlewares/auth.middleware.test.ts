import { expect } from "chai";
import sinon, { type SinonSandbox, type SinonStub } from "sinon";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import esmock from "esmock";
import { UnauthorizedException } from "../../../src/exceptions/unauthorized.ts";

const TEST_JWT_SECRET = process.env.TEST_JWT_SECRET || process.env.JWT_SECRET || "test-jwt-secret-for-local-dev";

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

describe("Auth Middleware Tests", () => {
    let sandbox: SinonSandbox;
    let authMiddlewareModule: any;
    let mockPrismaClient: any;

    const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        role: "USER",
        createdAt: new Date(),
        updatedAt: new Date()
    };

    beforeEach(async () => {
        sandbox = sinon.createSandbox();

        mockPrismaClient = {
            user: {
                findFirst: sandbox.stub()
            }
        };

        authMiddlewareModule = await esmock("../../../src/middlewares/auth.ts", {
            "../../../src/db/prisma.ts": {
                prismaClient: mockPrismaClient
            },
            "../../../src/secrets.ts": {
                JWT_SECRET: TEST_JWT_SECRET
            }
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("authMiddleware", () => {
        it("should call next with UnauthorizedException when no token provided", async () => {
            const req = createMockRequest({
                headers: {}
            }) as Request;
            const res = createMockResponse() as Response;
            const next = createMockNext();

            await authMiddlewareModule.authMiddleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0]).to.be.instanceOf(UnauthorizedException);
            expect(next.firstCall.args[0].message).to.equal("No token provided");
        });

        it("should authenticate user with valid token", async () => {
            const token = jwt.sign({ userId: 1 }, TEST_JWT_SECRET);
            const req = createMockRequest({
                headers: { authorization: token }
            }) as Request;
            const res = createMockResponse() as Response;
            const next = createMockNext();

            mockPrismaClient.user.findFirst.resolves(mockUser);

            await authMiddlewareModule.authMiddleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args).to.be.empty;
            expect(req.user).to.deep.equal(mockUser);
        });

        it("should call next with UnauthorizedException for invalid token", async () => {
            const req = createMockRequest({
                headers: { authorization: "invalid-token" }
            }) as Request;
            const res = createMockResponse() as Response;
            const next = createMockNext();

            await authMiddlewareModule.authMiddleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0]).to.be.instanceOf(UnauthorizedException);
        });

        it("should call next with UnauthorizedException when user not found", async () => {
            const token = jwt.sign({ userId: 999 }, TEST_JWT_SECRET);
            const req = createMockRequest({
                headers: { authorization: token }
            }) as Request;
            const res = createMockResponse() as Response;
            const next = createMockNext();

            mockPrismaClient.user.findFirst.resolves(null);

            await authMiddlewareModule.authMiddleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0]).to.be.instanceOf(UnauthorizedException);
            expect(next.firstCall.args[0].message).to.equal("User not found");
        });

        it("should handle non-Error exceptions in catch block", async () => {
            const token = jwt.sign({ userId: 1 }, TEST_JWT_SECRET);
            const req = createMockRequest({
                headers: { authorization: token }
            }) as Request;
            const res = createMockResponse() as Response;
            const next = createMockNext();

            // Reject with a non-Error value to test the else branch
            mockPrismaClient.user.findFirst.rejects({ notAnError: true });

            await authMiddlewareModule.authMiddleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0]).to.be.instanceOf(UnauthorizedException);
        });

        it("should use error message from Error instance", async () => {
            const token = jwt.sign({ userId: 1 }, TEST_JWT_SECRET);
            const req = createMockRequest({
                headers: { authorization: token }
            }) as Request;
            const res = createMockResponse() as Response;
            const next = createMockNext();

            mockPrismaClient.user.findFirst.rejects(new Error("Database connection failed"));

            await authMiddlewareModule.authMiddleware(req, res, next);

            expect(next.calledOnce).to.be.true;
            expect(next.firstCall.args[0]).to.be.instanceOf(UnauthorizedException);
            expect(next.firstCall.args[0].message).to.equal("Database connection failed");
        });
    });
});
