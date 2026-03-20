import { describe, it, expect } from "vitest";
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from "../../src/utils/jwt.js";

describe("jwt", () => {
  it("signs and verifies an access token", () => {
    const token = signAccessToken({ userId: "123" });
    const payload = verifyAccessToken(token);
    expect(payload.userId).toBe("123");
  });

  it("signs and verifies a refresh token", () => {
    const token = signRefreshToken({ userId: "456" });
    const payload = verifyRefreshToken(token);
    expect(payload.userId).toBe("456");
  });

  it("throws on invalid access token", () => {
    expect(() => verifyAccessToken("invalid")).toThrow();
  });

  it("throws when verifying access token with refresh secret", () => {
    const token = signRefreshToken({ userId: "123" });
    expect(() => verifyAccessToken(token)).toThrow();
  });
});
