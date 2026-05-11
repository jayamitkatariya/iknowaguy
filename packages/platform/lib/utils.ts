import crypto from "crypto";
import { createHash } from "crypto";

export function generateApiKey(): string {
  return `ikg_live_${crypto.randomBytes(32).toString("hex")}`;
}

export function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}

export function generateCompletionCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return code;
}

export function sanitizeInput(input: string, maxLength: number = 5000): string {
  let sanitized = input.trim().replace(/<[^>]*>/g, "");
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }
  return sanitized;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function formatPrice(amount: number | null, currency: string): string {
  if (amount === null) return "Negotiable";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}
