/**
 * 后端共享类型定义
 * 供各个服务层共同引用
 */

export interface GameState {
  turn_count: number;
  storyPhase: number;
  chatHistory: any[];
  openAiHistory: any[];
  emotion: string;
  reply: string;
  reply_ja?: string;
  reply_zh?: string;
  reply_en?: string;
  suggested_options: string[];
  suggested_options_ja?: string[];
  suggested_options_zh?: string[];
  suggested_options_en?: string[];
  isGameOver: boolean;
  gameOverType?: string;
  ready_to_draft?: boolean;
  refusal?: boolean;
  trigger_cg?: string;
  narrator_text_zh?: string;
  narrator_text_ja?: string;
  narrator_text_en?: string;
  playerName?: string;
  trust: number;
  affection: number;
  pastMemory?: string;
  prop?: string;
  isNGPlus?: boolean;
  isGameOverFromPhase?: boolean;
}

export interface LLMResponse {
  reply_ja: string;
  reply_zh: string;
  reply_en: string;
  emotion: string;
  suggested_options_ja: string[];
  suggested_options_zh: string[];
  suggested_options_en: string[];
  resonance_change: number;
  favorability_change: number;
  ready_to_draft: boolean;
  refusal: boolean;
  memory_summary?: string;
  letter_tags?: string[];
}

export interface ChatRequest {
  message: string;
  reset?: boolean;
  state: GameState;
}

export interface ChatResponse extends LLMResponse {
  trust: number;
  affection: number;
  isGameOver: boolean;
  gameOverType: string;
  turn_count: number;
  storyPhase: number;
  chatHistory: any[];
  openAiHistory: any[];
}

export interface MemoryEntry {
  text: string;
  embedding: number[];
  timestamp: number;
}

export interface TTSRequest {
  text: string;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
}
