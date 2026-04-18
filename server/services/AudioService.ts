import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

export class AudioService {
  static async synthesizeJapaneseVoice(text: string): Promise<Buffer> {
    const { EdgeTTS } = await import('node-edge-tts');
    const tts = new EdgeTTS({
      voice: 'ja-JP-NanamiNeural',
      lang: 'ja-JP',
      pitch: '+10Hz',
      rate: '-10%',
      volume: '+0%',
    });

    const tempFilePath = path.join(os.tmpdir(), `${randomUUID()}.mp3`);

    try {
      await tts.ttsPromise(text, tempFilePath);
      return fs.readFileSync(tempFilePath);
    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }
}
