import { describe, it, expect, vi, beforeAll } from "vitest";
import {
  sanitizeInput,
  validateEmail,
  formatPrice,
  generateCompletionCode,
} from "../utils.js";

beforeAll(() => {
  vi.stubGlobal("crypto", {
    ...globalThis.crypto,
    randomInt: (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min,
  });
});

describe("sanitizeInput", () => {
  it("strips HTML tags", () => {
    expect(sanitizeInput("<script>alert('xss')</script>Hello", 1000)).toBe("alert('xss')Hello");
  });

  it("strips multiple HTML tags", () => {
    expect(sanitizeInput("<b>Bold</b> and <i>italic</i>", 1000)).toBe("Bold and italic");
  });

  it("truncates to maxLength", () => {
    const long = "a".repeat(300);
    expect(sanitizeInput(long, 200).length).toBe(200);
  });

  it("trims whitespace", () => {
    expect(sanitizeInput("  hello  ", 1000)).toBe("hello");
  });

  it("handles empty string", () => {
    expect(sanitizeInput("", 1000)).toBe("");
  });
});

describe("validateEmail", () => {
  it("validates correct emails", () => {
    expect(validateEmail("user@example.com")).toBe(true);
    expect(validateEmail("test.user+tag@domain.co")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(validateEmail("notanemail")).toBe(false);
    expect(validateEmail("@missinglocal.com")).toBe(false);
    expect(validateEmail("missing@")).toBe(false);
    expect(validateEmail("missing@domain")).toBe(false);
    expect(validateEmail("")).toBe(false);
  });
});

describe("formatPrice", () => {
  it("formats USD correctly", () => {
    expect(formatPrice(25, "USD")).toBe("$25.00");
  });

  it("formats EUR correctly", () => {
    expect(formatPrice(100, "EUR")).toContain("100");
  });

  it("returns Negotiable for null amount", () => {
    expect(formatPrice(null, "USD")).toBe("Negotiable");
  });

  it("formats zero correctly", () => {
    expect(formatPrice(0, "USD")).toBe("$0.00");
  });
});

describe("generateCompletionCode", () => {
  it("generates a code of correct length", () => {
    const code = generateCompletionCode();
    expect(code.length).toBe(6);
  });

  it("generates codes with valid characters", () => {
    const code = generateCompletionCode();
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it("generates unique codes", () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateCompletionCode()));
    expect(codes.size).toBeGreaterThan(40);
  });
});