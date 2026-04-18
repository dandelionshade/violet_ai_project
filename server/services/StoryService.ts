/**
 * 故事服务（Story Service）
 * 从 StoryManager 迁移，负责剧情状态推进与系统提示词生成
 * 目前是直接引用现有的 StoryManager，后续可配置化
 */

import { StoryManager } from '../StoryManager';
import type { GameState } from '../models/types';

export class StoryService {
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
    isGameOver: boolean
  ): {
    storyPhase: number;
    turn_count: number;
    isGameOver: boolean;
    gameOverType: string;
  } {
    let { storyPhase, turn_count } = state;
    let gameOverType = '';
    let finalIsGameOver = isGameOver;

    if (!finalIsGameOver) {
      if (llmResponse.refusal) {
        storyPhase = 6; // REFUSAL
        finalIsGameOver = true;
        gameOverType = 'refusal';
      } else if (storyPhase === 1) {
        storyPhase = 2;
      } else if (storyPhase === 2) {
        storyPhase = 3;
      } else if (storyPhase === 3) {
        if (llmResponse.ready_to_draft) {
          storyPhase = 4; // DRAFTING
        }
      } else if (storyPhase === 4) {
        storyPhase = 5; // DELIVERY
        finalIsGameOver = true;

        // 根据好感度确定结局类型
        const { affection, isNGPlus } = state;
        if (isNGPlus) {
          gameOverType = affection >= 80 ? 'true_ending' : 'ng_normal_ending';
        } else {
          if (affection < 30) {
            gameOverType = 'bad_ending';
          } else if (affection >= 60) {
            gameOverType = 'good_ending';
          } else {
            gameOverType = 'normal_ending';
          }
        }
      }

      turn_count++;
    }

    return {
      storyPhase,
      turn_count,
      isGameOver: finalIsGameOver,
      gameOverType,
    };
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

    const trust = clamp((state.trust || 0) + (llmResponse.resonance_change || 0), 0, 100);
    const affection = clamp(
      (state.affection || 10) + (llmResponse.favorability_change || 0),
      0,
      100
    );

    return { trust, affection };
  }
}
