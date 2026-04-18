import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import type { RequestWithContext } from './logger';

interface ErrorWithStatus extends Error {
  status?: number;
  code?: string;
}

export function errorHandler(
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const request = req as RequestWithContext;
  const requestId = request.requestId || randomUUID();
  const durationMs = request.requestStartTime
    ? Date.now() - request.requestStartTime
    : 0;

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  const errorLog = {
    level: 'error',
    timestamp: new Date().toISOString(),
    requestId,
    method: req.method,
    path: req.originalUrl || req.path,
    statusCode: status,
    durationMs,
    code,
    message,
    errorName: err.name,
    stack: err.stack,
  };

  console.error(JSON.stringify(errorLog));
  res.setHeader('x-request-id', requestId);

  res.status(status).json({
    error: {
      requestId,
      code,
      message,
      status,
      timestamp: new Date().toISOString(),
    },
  });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
