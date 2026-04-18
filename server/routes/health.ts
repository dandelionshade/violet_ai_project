import { Router, Request, Response } from 'express';
import type { HealthResponse } from '../models/types';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  const response: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.1.0-refactored',
  };

  res.json(response);
});

export default router;
