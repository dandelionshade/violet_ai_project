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
  
  // 选项（兼容：元素可以是字符串或对象）
  suggested_options: Option[];
  suggested_options_ja?: Option[];
  suggested_options_zh?: Option[];
  suggested_options_en?: Option[];
  
  // 节点元信息
  storyNodeTitle_zh?: string;
  storyNodeTitle_ja?: string;
  storyNodeTitle_en?: string;
  storyNodeObjective_zh?: string;
  storyNodeObjective_ja?: string;
  storyNodeObjective_en?: string;
  storyNodeType?: 'mainline' | 'branch' | 'recovery' | 'pause' | 'ending' | 'refusal';
  storyNodeType?: 'mainline' | 'branch' | 'recovery' | 'pause' | 'ending' | 'refusal';
  
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

export interface Option {
  id: string;
  label: string;
  next_phase?: number | null;
  trust_delta?: number;
  affection_delta?: number;
  metadata?: Record<string, any> | string;
}
