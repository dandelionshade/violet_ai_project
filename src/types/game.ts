/**
 * 游戏通用类型定义 (Shared Game Types)
 * 供前后端共同引用，确保数据结构的一致性。
 */

export interface GameState {
  // 基础进度
  turn_count: number;
  storyPhase: number;
  
  // 对话历史
  chatHistory: any[];
  openAiHistory: any[];
  
  // 当前表现状态
  emotion: string;
  reply: string;
  reply_ja?: string;
  reply_zh?: string;
  reply_en?: string;
  
  // 选项
  suggested_options: string[];
  suggested_options_ja?: string[];
  suggested_options_zh?: string[];
  suggested_options_en?: string[];
  
  // 游戏逻辑状态
  isGameOver: boolean;
  gameOverType?: string;
  ready_to_draft?: boolean;
  refusal?: boolean;
  trigger_cg?: string;
  narrator_text_zh?: string;
  narrator_text_ja?: string;
  narrator_text_en?: string;
  
  // 角色属性
  playerName?: string;
  trust: number;     // 0-100
  affection: number; // 0-100
  
  // 跨周目与信件因素
  pastMemory?: string;
  prop?: string;
  isNGPlus?: boolean;
  isGameOverFromPhase?: boolean;
}

export interface Letter {
  id: string;
  date: string;
  content: string;
  tags: string[];
}

export interface SaveSlot {
  id: number;
  date: string;
  state: GameState;
}

export interface PlayerMemory {
  playerName: string;
  summary: string;
  lastTrust: number;
  unlockedNGPlus: boolean;
}
