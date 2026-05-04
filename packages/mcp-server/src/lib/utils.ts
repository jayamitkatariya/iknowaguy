export function sanitizeInput(input: string, maxLength: number = 5000): string {
  let sanitized = input.trim().replace(/<[^>]*>/g, "");
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }
  return sanitized;
}
