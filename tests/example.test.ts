import { describe, it, expect } from "vitest";
import sum from "@/index.ts";

describe("Example Test Suite", () => {
  it("should pass a basic test", () => {
    const result = 1 + 1;
    expect(result).toBe(2);
  });
});

describe("index.ts", () => {
  it("sum", () => {
    const result = sum([1, 2]);
    expect(result).toBe(3);
  });
});
