import { expect } from "chai";
import sinon, { type SinonSandbox } from "sinon";
import esmock from "esmock";
import * as bcrypt from "bcrypt";

const TEST_PASSWORD = process.env.TEST_PASSWORD || "testpassword";
const TEST_JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-for-local-dev";

describe("Auth Service Tests", () => {
    let sandbox: SinonSandbox;
    let authService: any;
    let mockPrismaClient: any;

    const hashedPassword = bcrypt.hashSync(TEST_PASSWORD, 10);
    const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
        role: "USER",
        createdAt: new Date(),
        updatedAt: new Date()
    };

    beforeEach(async () => {
        sandbox = sinon.createSandbox();

        mockPrismaClient = {
            user: {
                findFirst: sandbox.stub(),
                create: sandbox.stub()
            }
        };

        authService = await esmock("../../../src/services/auth.service.ts", {
            "../../../src/db/prisma.ts": { prismaClient: mockPrismaClient },
            "../../../src/secrets.ts": { JWT_SECRET: TEST_JWT_SECRET }
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("signupUser", () => {
        it("should create a new user when email is not taken", async () => {
            mockPrismaClient.user.findFirst.resolves(null);
            mockPrismaClient.user.create.resolves(mockUser);

            const result = await authService.signupUser("Test User", "test@example.com", TEST_PASSWORD, "USER");

            expect(mockPrismaClient.user.create.calledOnce).to.be.true;
            expect(result).to.deep.equal(mockUser);
        });

        it("should hash the password before creating user", async () => {
            mockPrismaClient.user.findFirst.resolves(null);
            mockPrismaClient.user.create.resolves(mockUser);

            await authService.signupUser("Test User", "test@example.com", TEST_PASSWORD, "USER");

            const createCall = mockPrismaClient.user.create.firstCall.args[0];
            expect(createCall.data.password).to.not.equal(TEST_PASSWORD);
            expect(bcrypt.compareSync(TEST_PASSWORD, createCall.data.password)).to.be.true;
        });

        it("should throw BadRequestException when user already exists", async () => {
            mockPrismaClient.user.findFirst.resolves(mockUser);

            try {
                await authService.signupUser("Test User", "test@example.com", TEST_PASSWORD, "USER");
                expect.fail("Should have thrown");
            } catch (error: any) {
                expect(error.statusCode).to.equal(400);
                expect(error.message).to.equal("User already exists");
            }
        });
    });

    describe("loginUser", () => {
        it("should return user and token on valid credentials", async () => {
            mockPrismaClient.user.findFirst.resolves(mockUser);

            const result = await authService.loginUser("test@example.com", TEST_PASSWORD);

            expect(result).to.have.property("user");
            expect(result).to.have.property("token");
            expect(result.user).to.deep.equal(mockUser);
            expect(typeof result.token).to.equal("string");
        });

        it("should throw NotFoundException when user does not exist", async () => {
            mockPrismaClient.user.findFirst.resolves(null);

            try {
                await authService.loginUser("notfound@example.com", TEST_PASSWORD);
                expect.fail("Should have thrown");
            } catch (error: any) {
                expect(error.statusCode).to.equal(404);
                expect(error.message).to.equal("User not found");
            }
        });

        it("should throw BadRequestException for wrong password", async () => {
            mockPrismaClient.user.findFirst.resolves(mockUser);

            try {
                await authService.loginUser("test@example.com", "wrongpassword");
                expect.fail("Should have thrown");
            } catch (error: any) {
                expect(error.statusCode).to.equal(400);
                expect(error.message).to.equal("Invalid password");
            }
        });
    });
});
