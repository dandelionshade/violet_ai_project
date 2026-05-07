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
  suggested_options: Option[];
  suggested_options_ja?: Option[];
  suggested_options_zh?: Option[];
  suggested_options_en?: Option[];
  isGameOver: boolean;
  gameOverType?: string;
  ready_to_draft?: boolean;
  refusal?: boolean;
  trigger_cg?: string;
  narrator_text_zh?: string;
  narrator_text_ja?: string;
  narrator_text_en?: string;
  storyNodeTitle_zh?: string;
  storyNodeTitle_ja?: string;
  storyNodeTitle_en?: string;
  storyNodeObjective_zh?: string;
  storyNodeObjective_ja?: string;
  storyNodeObjective_en?: string;
  storyNodeType?: 'mainline' | 'branch' | 'recovery' | 'pause' | 'ending' | 'refusal';
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
  suggested_options_ja: Option[];
  suggested_options_zh: Option[];
  suggested_options_en: Option[];
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
  selected_option_id?: string;
  state: GameState;
}

export interface ChatResponse extends LLMResponse {
  trust: number;
  affection: number;
  isGameOver: boolean;
  gameOverType: string;
  turn_count: number;
  storyPhase: number;
  storyNodeTitle_zh?: string;
  storyNodeTitle_ja?: string;
  storyNodeTitle_en?: string;
  storyNodeObjective_zh?: string;
  storyNodeObjective_ja?: string;
  storyNodeObjective_en?: string;
  storyNodeType?: 'mainline' | 'branch' | 'recovery' | 'pause' | 'ending' | 'refusal';
  chatHistory: any[];
  openAiHistory: any[];
}

export interface Option {
  id: string;
  label: string;
  next_phase?: number | null;
  trust_delta?: number;
  affection_delta?: number;
  metadata?: Record<string, any> | string;
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
