import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '.data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface MemoryEntry {
  text: string;
  embedding: number[];
  timestamp: number;
}

export class ServerVectorDB {
  /**
   * Helper: cosine similarity
   */
  private static cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private static getFilePath(playerName: string): string {
    // Sanitize playerName to prevent path traversal
    const safeName = playerName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'default_user';
    return path.join(DATA_DIR, `memory_${safeName}.json`);
  }

  private static loadMemories(playerName: string): MemoryEntry[] {
    const filePath = this.getFilePath(playerName);
    if (!fs.existsSync(filePath)) {
      return [];
    }
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch(e) {
      console.error('Failed to load server memories:', e);
      return [];
    }
  }

  private static saveMemories(playerName: string, memories: MemoryEntry[]) {
    const filePath = this.getFilePath(playerName);
    try {
      fs.writeFileSync(filePath, JSON.stringify(memories), 'utf-8');
    } catch(e) {
      console.error('Failed to save server memories:', e);
    }
  }

  public static addMemory(playerName: string, text: string, embedding: number[]) {
    const memories = this.loadMemories(playerName);
    memories.push({
      text,
      embedding,
      timestamp: Date.now()
    });
    this.saveMemories(playerName, memories);
  }

  public static search(playerName: string, queryEmbedding: number[], topK: number = 3): string[] {
    const memories = this.loadMemories(playerName);
    if (memories.length === 0) return [];

    const scored = memories.map(m => ({
      text: m.text,
      score: this.cosineSimilarity(queryEmbedding, m.embedding)
    }));

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // Return the top K relevant text
    return scored.slice(0, topK).map(s => s.text);
  }
}
