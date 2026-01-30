import sinon from "sinon";

export const mockUser = {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    password: "$2b$10$hashedpassword123456789012345678901234567890",
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
