import fs from 'fs';
import path from 'path';

const LOG_DIR = path.resolve(process.cwd(), 'server', 'analytics');
const LOG_FILE = path.join(LOG_DIR, 'selection_log.jsonl');

export class AnalyticsService {
  static async recordSelection(playerName: string, optionId: string, context: Record<string, any> = {}) {
    try {
      if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
      }
      const entry = {
        timestamp: Date.now(),
        playerName,
        optionId,
        context,
      };
      await fs.promises.appendFile(LOG_FILE, JSON.stringify(entry) + '\n', { encoding: 'utf8' });
      return true;
    } catch (err) {
      console.warn('[Analytics] Failed to record selection', err);
      return false;
    }
  }
}
