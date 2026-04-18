import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '.data');
const DEFAULT_DATABASE_PATH = path.join(DATA_DIR, 'memory.sqlite');

export interface MemoryEntry {
  id?: string;
  text: string;
  embedding: number[];
  timestamp: number;
}

export class ServerVectorDB {
  private static database: DatabaseSync | null = null;
  private static databasePath = process.env.VECTOR_DB_PATH || DEFAULT_DATABASE_PATH;

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

  private static ensureDataDirectory(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private static openDatabase(): DatabaseSync {
    if (!this.database) {
      this.ensureDataDirectory();
      this.database = new DatabaseSync(this.databasePath);
      this.database.exec(`
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        CREATE TABLE IF NOT EXISTS memories (
          id TEXT PRIMARY KEY,
          player_name TEXT NOT NULL,
          text TEXT NOT NULL,
          embedding TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_memories_player_name
          ON memories(player_name);
        CREATE INDEX IF NOT EXISTS idx_memories_player_timestamp
          ON memories(player_name, timestamp DESC);
      `);
    }

    return this.database;
  }

  private static serializeEmbedding(embedding: number[]): string {
    return JSON.stringify(embedding);
  }

  private static parseEmbedding(serializedEmbedding: string): number[] {
    try {
      const parsedEmbedding = JSON.parse(serializedEmbedding);
      return Array.isArray(parsedEmbedding)
        ? parsedEmbedding.filter((value): value is number => typeof value === 'number')
        : [];
    } catch (error) {
      console.error('Failed to parse stored embedding:', error);
      return [];
    }
  }

  public static initialize(): void {
    this.openDatabase();
  }

  public static ensureIndexExists(): void {
    this.initialize();
  }

  public static addMemory(playerName: string, text: string, embedding: number[]): string {
    const database = this.openDatabase();
    const timestamp = Date.now();
    const recordId = `${playerName}-${timestamp}-${randomUUID().slice(0, 8)}`;

    database
      .prepare(
        `
          INSERT INTO memories (id, player_name, text, embedding, timestamp)
          VALUES (?, ?, ?, ?, ?)
        `
      )
      .run(recordId, playerName, text, this.serializeEmbedding(embedding), timestamp);

    return recordId;
  }

  public static search(playerName: string, queryEmbedding: number[], topK: number = 3): string[] {
    const database = this.openDatabase();
    const rows = database
      .prepare(
        `
          SELECT text, embedding, timestamp
          FROM memories
          WHERE player_name = ?
          ORDER BY timestamp DESC
        `
      )
      .all(playerName) as Array<{ text: string; embedding: string; timestamp: number }>;

    if (rows.length === 0) {
      return [];
    }

    const scored = rows.map(row => ({
      text: row.text,
      score: this.cosineSimilarity(queryEmbedding, this.parseEmbedding(row.embedding)),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK).map(s => s.text);
  }

  public static deletePlayerMemories(playerName: string): void {
    const database = this.openDatabase();
    database.prepare('DELETE FROM memories WHERE player_name = ?').run(playerName);
  }
}
