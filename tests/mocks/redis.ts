import { vi } from "vitest";

vi.mock("../../src/config/redis.js", () => ({
  redis: { incr: vi.fn().mockResolvedValue(1), expire: vi.fn(), ttl: vi.fn().mockResolvedValue(60) },
}));
