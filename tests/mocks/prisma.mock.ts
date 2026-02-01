import sinon from "sinon";

const TEST_HASHED_PASSWORD = process.env.TEST_HASHED_PASSWORD || "$2b$10$K8YpJQ.EqGzVF9Y3r8zGQeYcGQVr5TtKxJYQQ5TGhTQhTQhTQhTQh";

export const mockUser = {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    password: TEST_HASHED_PASSWORD,
    createdAt: new Date(),
    updatedAt: new Date()
};

export const createMockPrismaClient = () => ({
    user: {
        findFirst: sinon.stub(),
        create: sinon.stub(),
        findUnique: sinon.stub(),
        update: sinon.stub(),
        delete: sinon.stub()
    }
});

let mockPrismaInstance = createMockPrismaClient();

export const getMockPrismaClient = () => mockPrismaInstance;

export const resetMockPrismaClient = () => {
    mockPrismaInstance = createMockPrismaClient();
    return mockPrismaInstance;
};
