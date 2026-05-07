const HTML_ENTITY_MAP: Record<string, string> = {
  "&lt;": "<",
  "&gt;": ">",
  "&amp;": "&",
  "&quot;": '"',
  "&#39;": "'",
  "&#x27;": "'",
  "&#x2F;": "/",
  "&#x3C;": "<",
  "&#x3E;": ">",
  "&#x60;": "`",
};

const HTML_ENTITY_REGEX = /&(?:lt|gt|amp|quot|#39|#x27|#x2F|#x3C|#x3E|#x60);/gi;

function decodeHtmlEntities(str: string): string {
  return str.replace(HTML_ENTITY_REGEX, (match) => HTML_ENTITY_MAP[match] ?? match);
}

export function sanitizeInput(input: string, maxLength: number = 5000): string {
  let sanitized = input.trim();

  sanitized = decodeHtmlEntities(sanitized);

  sanitized = sanitized.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  sanitized = sanitized.replace(/<script[\s\S]*?>/gi, "");
  sanitized = sanitized.replace(/<\/script>/gi, "");

  sanitized = sanitized.replace(/<[^>]*>/g, "");

  sanitized = sanitized.replace(/javascript:/gi, "");
  sanitized = sanitized.replace(/on\w+\s*=/gi, "");

  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}


