/**
 * 记忆服务（Memory Service）
 * 集中管理向量检索逻辑，调用 PineconeService
 */

import { PineconeService } from './PineconeService';
import { LLMService } from './LLMService';

export class MemoryService {
  /**
   * 检索相关历史记忆
   */
  static async retrieveRelevantMemories(
    playerName: string,
    message: string,
    topK: number = 3
  ): Promise<string[]> {
    try {
      // 生成当前消息的嵌入向量
      const embedding = await LLMService.generateEmbedding(message);

      // 在 Pinecone 中搜索相关向量
      const memories = await PineconeService.search(playerName, embedding, topK);

      console.log(
        `[Memory] Retrieved ${memories.length} relevant memories for player: ${playerName}`
      );
      return memories;
    } catch (error) {
      console.error('[Memory] Failed to retrieve memories:', error);
      // 降级处理，返回空数组，让 LLM 继续处理
      return [];
    }
  }

  /**
   * 保存新的对话记忆
   */
  static async saveMemory(playerName: string, message: string): Promise<void> {
    try {
      const embedding = await LLMService.generateEmbedding(message);
      await PineconeService.addMemory(playerName, message, embedding);
      console.log(`[Memory] Saved memory for player: ${playerName}`);
    } catch (error) {
      console.error('[Memory] Failed to save memory:', error);
      // 不抛出错误，内存失败不应阻塞主流程
    }
  }

  /**
   * 清除玩家的所有记忆
   */
  static async clearPlayerMemories(playerName: string): Promise<void> {
    try {
      await PineconeService.deletePlayerMemories(playerName);
      console.log(`[Memory] Cleared all memories for player: ${playerName}`);
    } catch (error) {
      console.error('[Memory] Failed to clear memories:', error);
      throw error;
    }
  }

  /**
   * 初始化（确保 Pinecone 索引存在）
   */
  static async initialize(): Promise<void> {
    try {
      await PineconeService.ensureIndexExists();
      console.log('[Memory] Memory service initialized');
    } catch (error) {
      console.error('[Memory] Failed to initialize:', error);
      throw error;
    }
  }
}
