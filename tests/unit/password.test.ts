import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword } from "../../src/utils/password.js";

describe("password", () => {
  it("hashes a password", async () => {
    const hash = await hashPassword("secret123");
    expect(hash).not.toBe("secret123");
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("comparePassword returns true for correct password", async () => {
    const hash = await hashPassword("secret123");
    expect(await comparePassword("secret123", hash)).toBe(true);
  });

  it("comparePassword returns false for wrong password", async () => {
    const hash = await hashPassword("secret123");
    expect(await comparePassword("wrong", hash)).toBe(false);
  });
});
