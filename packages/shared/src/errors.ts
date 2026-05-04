export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(message, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
    this.name = "ConflictError";
  }
}

export class PaymentError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "PAYMENT_ERROR", 402, details);
    this.name = "PaymentError";
  }
}

export class RoutingError extends AppError {
  constructor(message: string) {
    super(message, "ROUTING_ERROR", 500);
    this.name = "RoutingError";
  }
}

export class NotificationError extends AppError {
  constructor(channel: string, message: string, details?: Record<string, unknown>) {
    super(`[${channel}] ${message}`, "NOTIFICATION_ERROR", 500, details);
    this.name = "NotificationError";
  }
}
