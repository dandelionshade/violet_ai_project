import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

export interface RequestWithContext extends Request {
  requestId?: string;
  requestStartTime?: number;
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const request = req as RequestWithContext;
  const incomingRequestId = req.header('x-request-id');
  const requestId = typeof incomingRequestId === 'string' && incomingRequestId.length > 0
    ? incomingRequestId
    : randomUUID();

  request.requestId = requestId;
  request.requestStartTime = Date.now();
  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    const durationMs = request.requestStartTime
      ? Date.now() - request.requestStartTime
      : 0;

    const log = {
      level: 'info',
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      userAgent: req.get('user-agent') || '',
      ip: req.ip,
    };

    console.log(JSON.stringify(log));
  });

  next();
}
