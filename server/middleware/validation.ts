import { Request, Response, NextFunction } from 'express';
import { validateChatRequest, validateTTSRequest } from '../models/validators';

export function validateChatRequestMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const result = validateChatRequest(req.body);
  if (!result.ok) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: result.error,
        status: 400,
        timestamp: new Date().toISOString(),
      },
    });
  }

  req.body = result.data;
  next();
}

export function validateTTSRequestMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const result = validateTTSRequest(req.body);
  if (!result.ok) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: result.error,
        status: 400,
        timestamp: new Date().toISOString(),
      },
    });
  }

  req.body = result.data;
  next();
}
