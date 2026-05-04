import crypto from "crypto";
import { COMPLETION_CODE_LENGTH } from "./constants";

export function generateCompletionCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < COMPLETION_CODE_LENGTH; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    code += chars.charAt(randomIndex);
  }
  return code;
}

export function generateApiKeyPrefix(key: string): string {
  return `hah_${key.slice(0, 8)}`;
}

export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function isWithinRadius(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  radiusKm: number
): boolean {
  return calculateDistanceKm(lat1, lng1, lat2, lng2) <= radiusKm;
}

export function sanitizeInput(input: string, maxLength: number = 5000): string {
  let sanitized = input.trim().replace(/<[^>]*>/g, "");
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }
  return sanitized;
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function formatPrice(amount: number | null, currency: string): string {
  if (amount === null) return "Negotiable";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

export function parsePaginationParams(
  page: string | undefined,
  limit: string | undefined,
  defaultLimit: number = 20,
  maxLimit: number = 100
): { offset: number; limit: number } {
  const parsedPage = Math.max(1, parseInt(page || "1", 10));
  const parsedLimit = Math.min(
    maxLimit,
    Math.max(1, parseInt(limit || String(defaultLimit), 10))
  );
  return {
    offset: (parsedPage - 1) * parsedLimit,
    limit: parsedLimit,
  };
}
