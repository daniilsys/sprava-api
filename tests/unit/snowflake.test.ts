import { describe, it, expect } from "vitest";
import { generateSnowflake, parseSnowflake } from "../../src/utils/snowflake.js";

describe("snowflake", () => {
  it("generates a string id", () => {
    const id = generateSnowflake();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("generates mostly unique ids", () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateSnowflake()));
    expect(ids.size).toBeGreaterThanOrEqual(45);
  });

  it("parseSnowflake returns a date close to now", () => {
    const id = generateSnowflake();
    const date = parseSnowflake(id);
    expect(Math.abs(date.getTime() - Date.now())).toBeLessThan(1000);
  });
});
