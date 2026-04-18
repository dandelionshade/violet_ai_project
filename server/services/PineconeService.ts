/**
 * Pinecone 向量库服务
 * 替代原本地 VectorDB.ts，支持云端向量检索与持久化
 * 
 * 集成 Pinecone 向量数据库，支持：
 * - 向量存储与检索
 * - 跨用户的向量隔离（通过 metadata）
 * - 批量操作
 * - 向量更新与删除
 */

import { Pinecone } from '@pinecone-database/pinecone';

interface VectorRecord {
  id: string;
  values: number[];
  metadata: {
    playerName: string;
    text: string;
    timestamp: number;
  };
}

export class PineconeService {
  private static instance: Pinecone | null = null;
  private static indexName = process.env.PINECONE_INDEX_NAME || 'violet-ai-memories';
  private static namespace = 'memories';

  /**
   * 初始化 Pinecone 客户端（单例模式）
   */
  static async initialize() {
    if (!this.instance) {
      const apiKey = process.env.PINECONE_API_KEY;

      if (!apiKey) {
        throw new Error('PINECONE_API_KEY environment variable is not set');
      }

      this.instance = new Pinecone({
        apiKey,
      });

      console.log(`[Pinecone] Initialized with index: ${this.indexName}`);
    }

    return this.instance;
  }

  /**
   * 添加单条向量记录
   */
  static async addMemory(
    playerName: string,
    text: string,
    embedding: number[]
  ): Promise<string> {
    const client = await this.initialize();
    const index = client.index(this.indexName);

    const recordId = `${playerName}-${Date.now()}`;
    const record: VectorRecord = {
      id: recordId,
      values: embedding,
      metadata: {
        playerName,
        text,
        timestamp: Date.now(),
      },
    };

    try {
      await index.namespace(this.namespace).upsert({ records: [record] });
      console.log(`[Pinecone] Added memory: ${recordId}`);
      return recordId;
    } catch (error) {
      console.error('[Pinecone] Failed to add memory:', error);
      throw error;
    }
  }

  /**
   * 搜索相关向量（RAG 检索）
   */
  static async search(
    playerName: string,
    queryEmbedding: number[],
    topK: number = 3
  ): Promise<string[]> {
    const client = await this.initialize();
    const index = client.index(this.indexName);

    try {
      const results = await index.namespace(this.namespace).query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        // 使用 filter 按玩家隔离
        filter: {
          playerName: { $eq: playerName },
        },
      });

      return results.matches
        .filter(match => match.metadata?.text)
        .map(match => match.metadata!.text as string);
    } catch (error) {
      console.error('[Pinecone] Search failed:', error);
      // 降级处理：返回空数组，让 LLM 继续处理
      return [];
    }
  }

  /**
   * 批量添加向量（用于数据迁移）
   */
  static async batchUpsert(records: VectorRecord[]): Promise<void> {
    const client = await this.initialize();
    const index = client.index(this.indexName);

    try {
      // Pinecone 限制单次上传 100 条，所以分批处理
      const batchSize = 100;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await index.namespace(this.namespace).upsert({ records: batch });
        console.log(
          `[Pinecone] Upserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} records)`
        );
      }
    } catch (error) {
      console.error('[Pinecone] Batch upsert failed:', error);
      throw error;
    }
  }

  /**
   * 删除特定玩家的所有向量（重置用户数据）
   */
  static async deletePlayerMemories(playerName: string): Promise<void> {
    const client = await this.initialize();
    const index = client.index(this.indexName);

    try {
      await index.namespace(this.namespace).deleteMany({
        filter: {
          playerName: { $eq: playerName },
        },
      });
      console.log(`[Pinecone] Deleted all memories for player: ${playerName}`);
    } catch (error) {
      console.error('[Pinecone] Failed to delete player memories:', error);
      throw error;
    }
  }

  /**
   * 获取玩家的总向量数（用于统计）
   */
  static async getPlayerMemoryCount(playerName: string): Promise<number> {
    const client = await this.initialize();
    const index = client.index(this.indexName);

    try {
      const stats = await index.describeIndexStats();
      // 注意：Pinecone 的统计 API 有限制，这里返回一个估计值
      // 实际应用中可能需要另外维护计数
      console.log(`[Pinecone] Stats:`, stats);
      return 0; // 暂时返回 0，后续优化
    } catch (error) {
      console.error('[Pinecone] Failed to get stats:', error);
      return 0;
    }
  }

  /**
   * 创建或更新索引（初次设置时调用）
   */
  static async ensureIndexExists(): Promise<void> {
    const client = await this.initialize();

    try {
      // 检查索引是否存在
      const indexes = await client.listIndexes();
      const indexExists = indexes.indexes?.some(idx => idx.name === this.indexName) ?? false;

      if (!indexExists) {
        console.log(`[Pinecone] Creating index: ${this.indexName}`);
        await client.createIndex({
          name: this.indexName,
          dimension: 768, // Gemini embedding 维度
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'gcp',
              region: 'us-west1',
            },
          },
        });
        console.log(`[Pinecone] Index created successfully`);
      } else {
        console.log(`[Pinecone] Index already exists: ${this.indexName}`);
      }
    } catch (error) {
      console.error('[Pinecone] Failed to ensure index:', error);
      throw error;
    }
  }
}
