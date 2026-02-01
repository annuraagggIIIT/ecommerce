import sinon from "sinon";

export const createMockRequest = (overrides: any = {}) => {
    return {
        body: {},
        params: {},
        query: {},
        headers: {},
        ...overrides
    };
};

export const createMockResponse = () => {
    const res: any = {};
    res.status = sinon.stub().returns(res);
    res.json = sinon.stub().returns(res);
    res.send = sinon.stub().returns(res);
    return res;
};

export const createMockNext = () => sinon.stub();

const TEST_HASHED_PASSWORD = process.env.TEST_HASHED_PASSWORD || "$2b$10$K8YpJQ.EqGzVF9Y3r8zGQeYcGQVr5TtKxJYQQ5TGhTQhTQhTQhTQh";

export const mockUser = {
    id: 1,
    name: "Test User",
    email: "test@example.com",
    password: TEST_HASHED_PASSWORD,
    createdAt: new Date(),
    updatedAt: new Date()
};

export const mockPrismaClient = {
    user: {
        findFirst: sinon.stub(),
        create: sinon.stub(),
        findUnique: sinon.stub(),
        update: sinon.stub(),
        delete: sinon.stub()
    }
};
