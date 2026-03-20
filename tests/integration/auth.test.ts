import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "./setup.js";
import { prismaMock } from "../mocks/prisma.js";

const validUser = {
  id: "1", username: "alice", email: "alice@test.com",
  password: "$2b$12$LJ3m4ys3Lg1oPZxPB0kNWe8z8YXfVZp1SgKsYpN5C5.5FXbOKqXy6",
  avatarUrl: null, createdAt: new Date(), updatedAt: new Date(),
};

describe("POST /auth/register", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 201 on success", async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(validUser);
    prismaMock.refreshToken.create.mockResolvedValue({} as any);

    const res = await request(app)
      .post("/auth/register")
      .send({ username: "alice", email: "alice@test.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("returns 409 if user exists", async () => {
    prismaMock.user.findFirst.mockResolvedValue(validUser);

    const res = await request(app)
      .post("/auth/register")
      .send({ username: "alice", email: "alice@test.com", password: "password123" });

    expect(res.status).toBe(409);
  });

  it("returns 400 on invalid body", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ username: "al" });

    expect(res.status).toBe(400);
  });
});

describe("POST /auth/login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 on wrong credentials", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "wrong@test.com", password: "wrong" });

    expect(res.status).toBe(401);
  });
});
