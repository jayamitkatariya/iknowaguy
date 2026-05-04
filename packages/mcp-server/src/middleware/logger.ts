import type { Request, Response, NextFunction } from "express";

export function loggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = (req as any).id || "unknown";

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] req=${requestId} method=${req.method} path=${req.path} status=${res.statusCode} duration=${duration}ms`
    );
  });

  next();
}
