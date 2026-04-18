/**
 * 聊天路由 (Chat Route)
 * POST /api/chat
 * 
 * 这是主要的游戏对话接口，整合了所有服务层逻辑
 */

import { Router, Request, Response } from 'express';
import type { ChatRequest, ChatResponse, GameState } from '../models/types';
import { LLMService } from '../services/LLMService';
import { MemoryService } from '../services/MemoryService';
import { StoryService } from '../services/StoryService';
import { asyncHandler, errorHandler } from '../middleware/errorHandler';
import { validateChatRequestMiddleware } from '../middleware/validation';

const router = Router();

// 辅助函数：数值钳位
const clamp = (val: number, min: number, max: number) =>
  Math.min(max, Math.max(min, val));

/**
 * 主聊天接口
 */
router.post(
  '/chat',
  validateChatRequestMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { message, reset } = req.body as ChatRequest;
    const state = req.body.state as GameState;
    const playerName = state?.playerName || 'default_user';

    // ===== 第一步：RAG 记忆检索 =====
    let relevantMemories: string[] = [];
    if (message) {
      try {
        relevantMemories = await MemoryService.retrieveRelevantMemories(
          playerName,
          message,
          3
        );
      } catch (error) {
        console.warn('[Chat] RAG retrieval failed, continuing without memories:', error);
      }
    }

    // ===== 第二步：数值钳制 =====
    let trust = clamp(state?.trust || 10, 0, 100);
    let affection = clamp(state?.affection || 10, 0, 100);
    let turn_count = state?.turn_count || 1;
    let storyPhase = state?.storyPhase || 1;
    let chatHistory = state?.chatHistory || [];
    let openAiHistory = state?.openAiHistory || [];

    // ===== 第三步：处理重置 =====
    if (reset) {
      return res.json({
        status: 'ok',
        turn_count: 1,
        storyPhase: 1,
        chatHistory: [],
        openAiHistory: [],
      });
    }

    // ===== 第四步：处理提前结束 =====
    if (message && message.includes('离开邮局')) {
      const earlyResponse = StoryService.getEarlyEndingResponse();
      return res.json({
        ...earlyResponse,
        turn_count: 1,
        storyPhase: 1,
        chatHistory: [],
        openAiHistory: [],
      });
    }

    // ===== 第五步：准备游戏状态 =====
    const sanitizedState: GameState = {
      ...state,
      trust,
      affection,
      storyPhase,
      turn_count,
    };

    // ===== 第六步：生成系统提示词 =====
    const { prompt: systemPrompt, isGameOver: promptIsGameOver, gameOverType: promptGameOverType } = StoryService.getSystemPrompt(
      sanitizedState,
      relevantMemories
    );

    // ===== 第七步：调用 LLM =====
    const activeLLM = process.env.ACTIVE_LLM || 'deepseek';
    let jsonResponse: any;

    try {
      if (activeLLM === 'gemini') {
        jsonResponse = await LLMService.generateWithGemini(
          systemPrompt,
          chatHistory,
          message || '你好',
          3 // maxRetries
        );

        // 保存到 Gemini 历史记录
        chatHistory.push({ role: 'user', parts: [{ text: message || '你好' }] });
        chatHistory.push({ role: 'model', parts: [{ text: jsonResponse.reply_zh || jsonResponse.reply }] });
      } else {
        jsonResponse = await LLMService.generateWithOpenAI(
          systemPrompt,
          openAiHistory,
          message || '你好',
          3 // maxRetries
        );

        // 保存到 OpenAI 历史记录
        openAiHistory.push({ role: 'user', content: message || '你好' });
        openAiHistory.push({ role: 'assistant', content: JSON.stringify(jsonResponse) });
      }
    } catch (error) {
      console.error('[Chat] LLM call failed:', error);
      return res.status(500).json({
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // ===== 第八步：推进游戏状态 =====
    const { storyPhase: newPhase, turn_count: newTurn, isGameOver, gameOverType } =
      StoryService.advanceGameState(sanitizedState, jsonResponse, promptIsGameOver);

    storyPhase = newPhase;
    turn_count = newTurn;

    // ===== 第九步：计算最终数值 =====
    const { trust: finalTrust, affection: finalAffection } =
      StoryService.calculateFinalValues(sanitizedState, jsonResponse);

    // ===== 第十步：保存对话记忆 =====
    if (message) {
      try {
        await MemoryService.saveMemory(playerName, message);
      } catch (error) {
        console.warn('[Chat] Failed to save memory, continuing:', error);
      }
    }

    // ===== 第十一步：返回响应 =====
    const response: ChatResponse = {
      ...jsonResponse,
      trust: finalTrust,
      affection: finalAffection,
      isGameOver,
      gameOverType,
      turn_count,
      storyPhase,
      chatHistory,
      openAiHistory,
    };

    res.json(response);
  })
);

export default router;
