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
import { getGraphOptions, getNodePresentation, mergeGraphOptionsWithGeneratedOptions, resolveGraphOption } from '../storyNodes';
import { asyncHandler, errorHandler } from '../middleware/errorHandler';
import { validateChatRequestMiddleware } from '../middleware/validation';

const router = Router();

// 辅助函数：数值钳位
const clamp = (val: number, min: number, max: number) =>
  Math.min(max, Math.max(min, val));

const deriveChoiceStyleGuide = (state: GameState, responseEmotion: string) => {
  if (state.storyPhase === 15) {
    return {
      mode: 'brief_pause',
      label: '轻微冷场',
      behavior: '选项短、柔和、留白，优先给玩家台阶。',
      focus: ['缓一下', '换一种问法', '保留主线'],
      avoid: ['强推进', '高压追问', '过长解释'],
    };
  }

  if (state.storyPhase === 13 || state.storyPhase === 14) {
    return {
      mode: 'recovery',
      label: '关系修复',
      behavior: '选项体现道歉、退让、重新建立节奏，语气克制但真诚。',
      focus: ['承认过急', '给空间', '重回主线'],
      avoid: ['逼问', '急于翻篇', '新增支线'],
    };
  }

  if ((state.trust ?? 0) >= 6 && (state.affection ?? 0) >= 55) {
    return {
      mode: 'intimate_branch',
      label: '高信任深入',
      behavior: '选项可以更私人、更愿意触碰回忆或支线，但仍必须服务当前章节目标。',
      focus: ['回忆', '支线回流', '深层情绪'],
      avoid: ['突兀切题', '无关玩笑', '破坏节奏'],
    };
  }

  if ((state.trust ?? 0) >= 3 || (state.affection ?? 0) >= 40) {
    return {
      mode: 'open',
      label: '稳定推进',
      behavior: '选项可以兼顾主线推进与适度共情，保持清晰的章节感。',
      focus: ['推进主线', '补充细节', '轻度共情'],
      avoid: ['过度花哨', '过度抽象'],
    };
  }

  return {
    mode: 'guarded',
    label: '谨慎收束',
    behavior: '选项要更短、更具体，以确认事实和降低压力为主。',
    focus: ['确认事实', '降低压力', '稳住关系'],
    avoid: ['催促', '长句', '一次问太多'],
  };
};

const buildDynamicOptionPrompt = (
  node: { title: string; objective: string; nodeType?: string },
  state: GameState,
  responseEmotion: string,
  canonicalOptionsZh: any[],
  canonicalOptionsJa: any[],
  canonicalOptionsEn: any[],
  sourceDialogue: string
) => `你是剧情选项文案生成器，只负责把既定框架里的选项改写成更自然的按钮文本。

规则：
1. 只输出 JSON。
2. 不要新增或删除选项。
3. 每个选项必须保留原有 id、next_phase、trust_delta、affection_delta、metadata 和 gameOver 语义。
4. 你可以改写 label，让它更贴合当前对话气氛。
5. 当节点是轻微冷场、关系降温或回流主线时，文案应该更短、更克制、更像“挽回”而不是“推进”。

风格档位：
${JSON.stringify(deriveChoiceStyleGuide(state, responseEmotion), null, 2)}

节点类型：
${node.nodeType || 'mainline'}

当前节点：
${JSON.stringify(node, null, 2)}

当前状态：
${JSON.stringify({ trust: state.trust, affection: state.affection, storyPhase: state.storyPhase, turn_count: state.turn_count, emotion: state.emotion, responseEmotion }, null, 2)}

近期对话：
${sourceDialogue}

框架选项（中文）：
${JSON.stringify(canonicalOptionsZh, null, 2)}

框架选项（日文）：
${JSON.stringify(canonicalOptionsJa, null, 2)}

框架选项（英文）：
${JSON.stringify(canonicalOptionsEn, null, 2)}

输出格式必须包含：reply_ja, reply_zh, reply_en, emotion, suggested_options_ja, suggested_options_zh, suggested_options_en, resonance_change, favorability_change, ready_to_draft, refusal。
其中 reply_* 可以留空字符串，emotion 设为 neutral，resonance_change 与 favorability_change 设为 0。`;

/**
 * 主聊天接口
 */
router.post(
  '/chat',
  validateChatRequestMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { message, reset, selected_option_id } = req.body as ChatRequest;
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
    const currentNodePresentation = getNodePresentation(storyPhase, 'zh');
    const sanitizedState: GameState = {
      ...state,
      trust,
      affection,
      storyPhase,
      turn_count,
      storyNodeType: currentNodePresentation.nodeType,
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

    // ===== 第八步：校验 LLM 输出并在失败时重试或回退 =====
    let validation = StoryService.validateLLMResponse(jsonResponse, { storyPhase: sanitizedState.storyPhase });
    if (!validation.valid) {
      console.warn('[Chat] LLM response failed validation, attempting one retry');
      try {
        let retryResponse: any;
        if (activeLLM === 'gemini') {
          retryResponse = await LLMService.generateWithGemini(
            systemPrompt,
            chatHistory,
            message || '你好',
            2
          );
          chatHistory.push({ role: 'model', parts: [{ text: retryResponse.reply_zh || retryResponse.reply }] });
        } else {
          retryResponse = await LLMService.generateWithOpenAI(
            systemPrompt,
            openAiHistory,
            message || '你好',
            2
          );
          openAiHistory.push({ role: 'assistant', content: JSON.stringify(retryResponse) });
        }

        const retryValidation = StoryService.validateLLMResponse(retryResponse, { storyPhase: sanitizedState.storyPhase });
        if (retryValidation.valid) {
          jsonResponse = retryValidation.sanitized;
        } else {
          console.error('[Chat] Retry also failed validation, falling back to early ending.');
          jsonResponse = StoryService.getEarlyEndingResponse();
        }
      } catch (err) {
        console.error('[Chat] Retry LLM call failed, falling back to early ending.', err);
        jsonResponse = StoryService.getEarlyEndingResponse();
      }
    } else {
      // 使用清洗后的结果，替换原始 jsonResponse，确保后续一致性
      jsonResponse = validation.sanitized;
    }

    // ===== 第九步：先应用 LLM 的数值变化得到基础数值，再根据剧情图选项 id 应用选项效果 =====
    // 计算 LLM 导致的基础 trust/affection
    const baseValues = StoryService.calculateFinalValues(sanitizedState, jsonResponse);
    sanitizedState.trust = baseValues.trust;
    sanitizedState.affection = baseValues.affection;

    // 如果前端传来了 selected_option_id，则在剧情图中查找并应用其效果
    if (selected_option_id) {
      const chosen = resolveGraphOption(sanitizedState.storyPhase, selected_option_id);
      if (chosen) {
        sanitizedState.trust = Math.max(0, Math.min(100, sanitizedState.trust + (chosen.effects?.trust_delta ?? 0)));
        sanitizedState.affection = Math.max(0, Math.min(100, sanitizedState.affection + (chosen.effects?.affection_delta ?? 0)));
        // 记录埋点（异步）
        try {
          const { AnalyticsService } = await import('../services/AnalyticsService');
          void AnalyticsService.recordSelection(playerName, selected_option_id, { storyPhase: sanitizedState.storyPhase, turn_count: sanitizedState.turn_count });
        } catch (err) {
          console.warn('[Chat] Analytics recording failed', err);
        }
      } else {
        console.warn('[Chat] selected_option_id not found in suggested options:', selected_option_id);
      }
    }

    // ===== 第十步：推进游戏状态 =====
    const { storyPhase: newPhase, turn_count: newTurn, isGameOver, gameOverType } =
      StoryService.advanceGameState(sanitizedState, jsonResponse, promptIsGameOver, selected_option_id);

    storyPhase = newPhase;
    turn_count = newTurn;

    const finalStoryNodeZh = getNodePresentation(storyPhase, 'zh');
    const finalStoryNodeJa = getNodePresentation(storyPhase, 'ja');
    const finalStoryNodeEn = getNodePresentation(storyPhase, 'en');

    const graphOptionsZhFinal = getGraphOptions(storyPhase, 'zh');
    const graphOptionsJaFinal = getGraphOptions(storyPhase, 'ja');
    const graphOptionsEnFinal = getGraphOptions(storyPhase, 'en');

    let finalSuggestedOptionsZh = graphOptionsZhFinal;
    let finalSuggestedOptionsJa = graphOptionsJaFinal;
    let finalSuggestedOptionsEn = graphOptionsEnFinal;

    if (graphOptionsZhFinal.length > 0 || graphOptionsJaFinal.length > 0 || graphOptionsEnFinal.length > 0) {
      try {
        const nodePrompt = buildDynamicOptionPrompt(
          { title: finalStoryNodeZh.title || '', objective: finalStoryNodeZh.objective || '', nodeType: finalStoryNodeZh.nodeType },
          sanitizedState,
          jsonResponse.emotion || sanitizedState.emotion || 'neutral',
          graphOptionsZhFinal,
          graphOptionsJaFinal,
          graphOptionsEnFinal,
          `${message || '（无用户输入）'}\n${jsonResponse.reply_zh || jsonResponse.reply || ''}`
        );

        const rewrittenOptions = activeLLM === 'gemini'
          ? await LLMService.generateWithGemini(nodePrompt, chatHistory, '请重写当前节点的选项文案。', 2)
          : await LLMService.generateWithOpenAI(nodePrompt, openAiHistory, '请重写当前节点的选项文案。', 2);

        const rewrittenValidation = StoryService.validateLLMResponse(rewrittenOptions, { storyPhase });
        if (rewrittenValidation.valid) {
          finalSuggestedOptionsZh = mergeGraphOptionsWithGeneratedOptions(graphOptionsZhFinal, rewrittenValidation.sanitized.suggested_options_zh);
          finalSuggestedOptionsJa = mergeGraphOptionsWithGeneratedOptions(graphOptionsJaFinal, rewrittenValidation.sanitized.suggested_options_ja);
          finalSuggestedOptionsEn = mergeGraphOptionsWithGeneratedOptions(graphOptionsEnFinal, rewrittenValidation.sanitized.suggested_options_en);
        }
      } catch (error) {
        console.warn('[Chat] Dynamic option rewrite failed, falling back to graph labels:', error);
      }
    }

    jsonResponse.suggested_options_zh = finalSuggestedOptionsZh;
    jsonResponse.suggested_options_ja = finalSuggestedOptionsJa;
    jsonResponse.suggested_options_en = finalSuggestedOptionsEn;
    jsonResponse.suggested_options = finalSuggestedOptionsZh;

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
      storyNodeTitle_zh: finalStoryNodeZh.title,
      storyNodeTitle_ja: finalStoryNodeJa.title,
      storyNodeTitle_en: finalStoryNodeEn.title,
      storyNodeObjective_zh: finalStoryNodeZh.objective,
      storyNodeObjective_ja: finalStoryNodeJa.objective,
      storyNodeObjective_en: finalStoryNodeEn.objective,
      storyNodeType: finalStoryNodeZh.nodeType,
      chatHistory,
      openAiHistory,
    };

    res.json(response);
  })
);

export default router;
