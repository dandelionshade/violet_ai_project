import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateTTSRequestMiddleware } from '../middleware/validation';
import { AudioService } from '../services/AudioService';

const router = Router();

router.post(
  '/tts',
  validateTTSRequestMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { text } = req.body as { text: string };

    const audioBuffer = await AudioService.synthesizeJapaneseVoice(text);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audioBuffer);
  })
);

export default router;
