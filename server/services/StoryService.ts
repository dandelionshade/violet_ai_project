/**
 * 故事服务（Story Service）
 * 从 StoryManager 迁移，负责剧情状态推进与系统提示词生成
 * 目前是直接引用现有的 StoryManager，后续可配置化
 */

import { StoryManager } from '../StoryManager';
import type { GameState } from '../models/types';
import { advanceStoryFromNode } from '../storyNodes';

export class StoryService {
  // 允许的情绪值
  private static allowedEmotions = new Set([
    'smile',
    'sad',
    'neutral',
    'surprised',
    'thoughtful',
    'crying',
  ] as const);

  /**
   * 校验并清洗 LLM 返回的 JSON，防止字段缺失或类型错误。
   * 返回 { valid, sanitized }
   */
  static validateLLMResponse(llmResponse: any, context?: { storyPhase?: number }) {
    const sanitized: any = {};
    let valid = true;
    const phasePrefix = typeof context?.storyPhase === 'number' ? `phase_${context.storyPhase}` : 'phase_unknown';

    const canonicalOptionIds = (() => {
      const candidateArrays = [llmResponse?.suggested_options_zh, llmResponse?.suggested_options_en, llmResponse?.suggested_options_ja];
      const primary = candidateArrays.find(Array.isArray) as unknown[] | undefined;
      if (!primary) return [] as string[];

      return primary.map((item: any, index: number) => {
        const providedId = typeof item === 'object' && item !== null && typeof item.id === 'string' && item.id.trim().length > 0 ? item.id.trim() : '';
        return providedId || `${phasePrefix}_opt_${index + 1}`;
      });
    })();

    const getCanonicalId = (index: number, item: any) => {
      const providedId = typeof item === 'object' && item !== null && typeof item.id === 'string' && item.id.trim().length > 0 ? item.id.trim() : '';
      return providedId || canonicalOptionIds[index] || `${phasePrefix}_opt_${index + 1}`;
    };

    const mustString = (k: string) => {
      if (typeof llmResponse?.[k] === 'string') sanitized[k] = llmResponse[k];
      else {
        sanitized[k] = '';
        valid = false;
      }
    };

    mustString('reply_zh');
    mustString('reply_en');
    mustString('reply_ja');

    // narrator texts 可选
    ['narrator_text_zh', 'narrator_text_en', 'narrator_text_ja'].forEach(k => {
      sanitized[k] = typeof llmResponse?.[k] === 'string' ? llmResponse[k] : '';
    });

    // emotion
    const emotion = llmResponse?.emotion;
    if (typeof emotion === 'string' && StoryService.allowedEmotions.has(emotion)) sanitized.emotion = emotion;
    else {
      sanitized.emotion = 'neutral';
      valid = false;
    }

    // suggested options - 期望对象数组，每项 { id, label, next_phase?, trust_delta?, affection_delta?, metadata? }
    const readOptions = (k: string) => {
      const raw = llmResponse?.[k];
      if (Array.isArray(raw)) {
        sanitized[k] = raw.map((o: any, index: number) => {
          if (typeof o === 'string') {
            return { id: canonicalOptionIds[index] || `${phasePrefix}_opt_${index + 1}`, label: o, next_phase: null, trust_delta: 0, affection_delta: 0, metadata: {} };
          }
          if (o && typeof o === 'object') {
            const id = getCanonicalId(index, o);
            const label = typeof o.label === 'string' ? o.label : String(o.id ?? '');
            const next_phase = typeof o.next_phase === 'number' ? o.next_phase : null;
            const trust_delta = Number.isFinite(Number(o.trust_delta)) ? Math.trunc(Number(o.trust_delta)) : 0;
            const affection_delta = Number.isFinite(Number(o.affection_delta)) ? Math.trunc(Number(o.affection_delta)) : 0;
            const metadata = o.metadata && typeof o.metadata === 'object' ? o.metadata : (typeof o.metadata === 'string' ? { note: o.metadata } : {});
            return { id: String(id), label: String(label), next_phase, trust_delta, affection_delta, metadata };
          }
          return { id: `${phasePrefix}_opt_${index + 1}`, label: '', next_phase: null, trust_delta: 0, affection_delta: 0, metadata: {} };
        });
      } else {
        sanitized[k] = [];
        if (raw !== undefined) valid = false;
      }
    };

    readOptions('suggested_options_zh');
    readOptions('suggested_options_en');
    readOptions('suggested_options_ja');

    // numeric deltas
    const rc = llmResponse?.resonance_change;
    sanitized.resonance_change = rc === -1 || rc === 0 || rc === 1 ? rc : 0;
    if (sanitized.resonance_change !== rc) valid = false;

    const fc = Number(llmResponse?.favorability_change);
    sanitized.favorability_change = Number.isFinite(fc) ? Math.max(-10, Math.min(25, fc)) : 0;
    if (Number.isNaN(fc)) valid = false;

    sanitized.ready_to_draft = !!llmResponse?.ready_to_draft;
    sanitized.refusal = !!llmResponse?.refusal;

    // 额外字段透传（例如 trigger_cg, memory_summary）
    ['trigger_cg', 'memory_summary'].forEach(k => {
      sanitized[k] = typeof llmResponse?.[k] === 'string' ? llmResponse[k] : '';
    });

    return { valid, sanitized };
  }
  /**
   * 获取当前剧情阶段的系统提示词和游戏结束状态
   */
  static getSystemPrompt(state: GameState, relevantMemories?: string[]) {
    return StoryManager.getSystemPrompt(state, relevantMemories);
  }

  /**
   * 获取提前结束的响应
   */
  static getEarlyEndingResponse() {
    return StoryManager.getEarlyEndingResponse();
  }

  /**
   * 推进游戏状态（阶段转换等）
   */
  static advanceGameState(
    state: GameState,
    llmResponse: any,
    isGameOver: boolean,
    selectedOptionId?: string
  ): {
    storyPhase: number;
    turn_count: number;
    isGameOver: boolean;
    gameOverType: string;
  } {
    return advanceStoryFromNode(state, llmResponse, isGameOver, selectedOptionId);
  }

  /**
   * 计算数值变化并钳制（确保在有效范围内）
   */
  static calculateFinalValues(
    state: GameState,
    llmResponse: any
  ): {
    trust: number;
    affection: number;
  } {
    const clamp = (val: number, min: number, max: number) =>
      Math.min(max, Math.max(min, val));

    const trust = clamp((state.trust ?? 0) + (llmResponse.resonance_change ?? 0), 0, 100);
    const affection = clamp(
      (state.affection ?? 10) + (llmResponse.favorability_change ?? 0),
      0,
      100
    );

    return { trust, affection };
  }

  /**
   * 根据玩家选择的选项对象应用效果：修改 trust/affection、可选跳转 storyPhase、增加 turn_count
   * option 期望结构：{ id, label, next_phase?, trust_delta?, affection_delta?, metadata? }
   */
  static applyOptionEffects(state: GameState, option: any): GameState {
    const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

    const trustDelta = Number.isFinite(Number(option?.trust_delta)) ? Math.trunc(Number(option.trust_delta)) : 0;
    const affectionDelta = Number.isFinite(Number(option?.affection_delta)) ? Math.trunc(Number(option.affection_delta)) : 0;

    const newTrust = clamp((state.trust ?? 0) + trustDelta, 0, 100);
    const newAffection = clamp((state.affection ?? 10) + affectionDelta, 0, 100);

    const newPhase = typeof option?.next_phase === 'number' ? option.next_phase : state.storyPhase;

    return {
      ...state,
      trust: newTrust,
      affection: newAffection,
      storyPhase: newPhase,
      turn_count: (state.turn_count || 1) + 1,
    };
  }
}
