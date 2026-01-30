import { expect } from "chai";
import sinon, { type SinonSandbox } from "sinon";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import request from "supertest";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { errorMiddleware } from "../../src/middlewares/errors.ts";
import { errorHandler } from "../../src/error-handler.ts";
import { BadRequestException } from "../../src/exceptions/bad-request.ts";
import { NotFoundException } from "../../src/exceptions/not-found.ts";
import { UnauthorizedException } from "../../src/exceptions/unauthorized.ts";
import { ErrorCode } from "../../src/exceptions/root.ts";
import { SignUpSchema } from "../../src/schema/user.ts";

describe("Auth Integration Tests", () => {
    let sandbox: SinonSandbox;
    let app: Express;
    let mockPrismaClient: any;
    const JWT_SECRET = process.env.JWT_SECRET || "test-secret";

    const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        password: bcrypt.hashSync("password123", 10),
        createdAt: new Date(),
        updatedAt: new Date()
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        mockPrismaClient = {
            user: {
                findFirst: sandbox.stub(),
                create: sandbox.stub()
            }
        };

        app = express();
        app.use(express.json());

        app.get("/api/health", (req: Request, res: Response) => {
            res.json({ status: "OK" });
        });

        app.post("/api/signup", errorHandler(async (req: Request, res: Response, next: NextFunction) => {
            SignUpSchema.parse(req.body);
            const { email, password, name } = req.body;
            let user = await mockPrismaClient.user.findFirst({ where: { email } });
            if (user) {
                next(new BadRequestException("User already exists", ErrorCode.USER_ALREADY_EXISTS));
                return;
            }
            user = await mockPrismaClient.user.create({
                data: { name, email, password: bcrypt.hashSync(password, 10) }
            });
            res.json(user);
        }));

        app.post("/api/login", errorHandler(async (req: Request, res: Response) => {
            const { email, password } = req.body;
            let user = await mockPrismaClient.user.findFirst({ where: { email } });
            if (!user) {
                throw new NotFoundException("User not found", ErrorCode.USER_NOT_FOUND);
            }
            if (!bcrypt.compareSync(password, user.password)) {
                throw new BadRequestException("Invalid password", ErrorCode.INCORRECT_PASSWORD);
            }
            const token = jwt.sign({ userId: user.id }, JWT_SECRET);
            res.json({ user, token });
        }));

        app.get("/api/me", async (req: Request, res: Response, next: NextFunction) => {
            const token = req.headers.authorization;
            if (!token) {
                next(new UnauthorizedException("No token provided", ErrorCode.UNAUTHORIZED));
                return;
            }
            try {
                const payload = jwt.verify(token, JWT_SECRET) as any;
                const user = await mockPrismaClient.user.findFirst({ where: { id: payload.userId } });
                if (!user) {
                    next(new UnauthorizedException("User not found", ErrorCode.UNAUTHORIZED));
                    return;
                }
                res.json({ user });
            } catch (error) {
                next(new UnauthorizedException("Invalid token", ErrorCode.UNAUTHORIZED));
            }
        });

        app.use(errorMiddleware);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("POST /api/signup", () => {
        it("should create a new user successfully", async () => {
            const newUser = {
                name: "New User",
                email: "new@example.com",
                password: "password123"
            };

            mockPrismaClient.user.findFirst.resolves(null);
            mockPrismaClient.user.create.resolves({
                id: 2,
                ...newUser,
                password: bcrypt.hashSync(newUser.password, 10),
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const response = await request(app)
                .post("/api/signup")
                .send(newUser)
                .expect(200);

            expect(response.body).to.have.property("id");
            expect(response.body.email).to.equal(newUser.email);
            expect(response.body.name).to.equal(newUser.name);
        });

        it("should return 400 when user already exists", async () => {
            mockPrismaClient.user.findFirst.resolves(mockUser);

            const response = await request(app)
                .post("/api/signup")
                .send({
                    name: "Test User",
                    email: "test@example.com",
                    password: "password123"
                })
                .expect(400);

            expect(response.body.message).to.equal("User already exists");
        });

        it("should return error for invalid email format", async () => {
            const response = await request(app)
                .post("/api/signup")
                .send({
                    name: "Test User",
                    email: "invalid-email",
                    password: "password123"
                })
                .expect(500);
        });

        it("should return error for short password", async () => {
            const response = await request(app)
                .post("/api/signup")
                .send({
                    name: "Test User",
                    email: "test@example.com",
                    password: "12345"
                })
                .expect(500);
        });
    });

    describe("POST /api/login", () => {
        it("should login successfully with valid credentials", async () => {
            mockPrismaClient.user.findFirst.resolves(mockUser);

            const response = await request(app)
                .post("/api/login")
                .send({
                    email: "test@example.com",
                    password: "password123"
                })
                .expect(200);

            expect(response.body).to.have.property("user");
            expect(response.body).to.have.property("token");
            expect(response.body.user.email).to.equal("test@example.com");
        });

        it("should return 404 when user not found", async () => {
            mockPrismaClient.user.findFirst.resolves(null);

            const response = await request(app)
                .post("/api/login")
                .send({
                    email: "notfound@example.com",
                    password: "password123"
                })
                .expect(404);

            expect(response.body.message).to.equal("User not found");
        });

        it("should return 400 for incorrect password", async () => {
            mockPrismaClient.user.findFirst.resolves(mockUser);

            const response = await request(app)
                .post("/api/login")
                .send({
                    email: "test@example.com",
                    password: "wrongpassword"
                })
                .expect(400);

            expect(response.body.message).to.equal("Invalid password");
        });
    });

    describe("GET /api/me", () => {
        it("should return user details when authenticated", async () => {
            const token = jwt.sign({ userId: 1 }, JWT_SECRET);
            mockPrismaClient.user.findFirst.resolves(mockUser);

            const response = await request(app)
                .get("/api/me")
                .set("Authorization", token)
                .expect(200);

            expect(response.body).to.have.property("user");
            expect(response.body.user.email).to.equal("test@example.com");
        });

        it("should return 401 when no token provided", async () => {
            const response = await request(app)
                .get("/api/me")
                .expect(401);

            expect(response.body.message).to.equal("No token provided");
        });

        it("should return 401 for invalid token", async () => {
            const response = await request(app)
                .get("/api/me")
                .set("Authorization", "invalid-token")
                .expect(401);

            expect(response.body.message).to.equal("Invalid token");
        });

        it("should return 401 when user not found for valid token", async () => {
            const token = jwt.sign({ userId: 999 }, JWT_SECRET);
            mockPrismaClient.user.findFirst.resolves(null);

            const response = await request(app)
                .get("/api/me")
                .set("Authorization", token)
                .expect(401);

            expect(response.body.message).to.equal("User not found");
        });
    });

    describe("GET /api/health", () => {
        it("should return OK status", async () => {
            const response = await request(app)
                .get("/api/health")
                .expect(200);

            expect(response.body).to.deep.equal({ status: "OK" });
        });
    });
});
