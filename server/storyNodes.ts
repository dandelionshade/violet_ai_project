import { readFileSync } from 'fs';
import type { GameState } from './models/types';

export interface StoryAdvanceResult {
  storyPhase: number;
  turn_count: number;
  isGameOver: boolean;
  gameOverType: string;
}

export interface StoryGraphOptionEffect {
  trust_delta?: number;
  affection_delta?: number;
}

export interface StoryGraphOptionLabel {
  zh: string;
  ja: string;
  en: string;
}

export interface StoryGraphNodeLabel {
  zh: string;
  ja: string;
  en: string;
}

export interface StoryGraphOptionConfig {
  id: string;
  label: StoryGraphOptionLabel;
  targetPhase: number;
  effects?: StoryGraphOptionEffect;
  isGameOver?: boolean;
  gameOverType?: string;
  metadata?: Record<string, unknown>;
}

interface StoryGraphTransitionConfig {
  when: string[];
  to: number;
  isGameOver?: boolean;
  gameOverType?: string;
}

interface StoryGraphNodeConfig {
  phase: number;
  title?: StoryGraphOptionLabel;
  objective?: StoryGraphNodeLabel;
  nodeType?: 'mainline' | 'branch' | 'recovery' | 'pause' | 'ending' | 'refusal';
  fallbackTo?: number;
  options?: StoryGraphOptionConfig[];
  transitions: StoryGraphTransitionConfig[];
}

interface StoryGraphConfig {
  version: number;
  startPhase: number;
  nodes: StoryGraphNodeConfig[];
}

const graphPath = new URL('./storyGraph.json', import.meta.url);
const storyGraph = JSON.parse(readFileSync(graphPath, 'utf8')) as StoryGraphConfig;

const STORY_NODE_MAP: Record<number, StoryGraphNodeConfig> = Object.fromEntries(
  storyGraph.nodes.map(node => [node.phase, node])
);

const clampPhase = (phase: number) => STORY_NODE_MAP[phase] ? phase : storyGraph.startPhase;

const deriveNodeType = (node: StoryGraphNodeConfig | null): 'mainline' | 'branch' | 'recovery' | 'pause' | 'ending' | 'refusal' => {
  if (!node) return 'mainline';
  if (node.nodeType) return node.nodeType;
  if (node.phase === 8) return 'ending';
  if (node.phase === 9) return 'refusal';
  if (node.phase === 13 || node.phase === 14) return 'recovery';
  if (node.phase === 15) return 'pause';
  if (node.phase >= 10 && node.phase <= 12) return 'branch';
  return 'mainline';
};

const resolveEndingType = (state: GameState) => {
  if (state.isNGPlus) {
    return (state.affection || 0) >= 80 ? 'true_ending' : 'ng_normal_ending';
  }

  if ((state.affection || 0) < 30) return 'bad_ending';
  if ((state.affection || 0) >= 60) return 'good_ending';
  return 'normal_ending';
};

const resolveGameOverType = (resolver: string | undefined, state: GameState): string => {
  if (!resolver) return '';
  if (resolver === 'resolve_ending_type') return resolveEndingType(state);
  return resolver;
};

const evaluateCondition = (condition: string, state: GameState, llmResponse: any): boolean => {
  if (condition === 'always') return true;
  if (condition === 'refusal') return Boolean(llmResponse?.refusal);
  if (condition === 'ready_to_draft') return Boolean(llmResponse?.ready_to_draft);
  if (condition === 'isNGPlus') return Boolean(state.isNGPlus);

  const numericMatch = condition.match(/^(affection|trust)_(gte|lte|gt|lt|eq):(\-?\d+)$/);
  if (numericMatch) {
    const [, field, operator, thresholdRaw] = numericMatch;
    const threshold = Number(thresholdRaw);
    const value = Number((state as any)[field] || 0);

    switch (operator) {
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'eq': return value === threshold;
      default: return false;
    }
  }

  const phaseMatch = condition.match(/^phase_eq:(\d+)$/);
  if (phaseMatch) {
    return state.storyPhase === Number(phaseMatch[1]);
  }

  return false;
};

const toLocalizedOption = (option: StoryGraphOptionConfig, language: 'zh' | 'ja' | 'en') => ({
  id: option.id,
  label: option.label[language],
  next_phase: option.targetPhase,
  trust_delta: option.effects?.trust_delta ?? 0,
  affection_delta: option.effects?.affection_delta ?? 0,
  metadata: option.metadata ?? {},
});

export function getStoryNode(phase: number): StoryGraphNodeConfig | null {
  return STORY_NODE_MAP[clampPhase(phase)] || null;
}

export function getGraphOptions(phase: number, language: 'zh' | 'ja' | 'en') {
  const node = getStoryNode(phase);
  return node?.options?.map(option => toLocalizedOption(option, language)) ?? [];
}

export function getNodePresentation(phase: number, language: 'zh' | 'ja' | 'en') {
  const node = getStoryNode(phase);
  return {
    phase: node?.phase ?? clampPhase(phase),
    title: node?.title?.[language] ?? '',
    objective: node?.objective?.[language] ?? '',
    nodeType: deriveNodeType(node),
  };
}

export function resolveGraphOption(phase: number, optionId: string): StoryGraphOptionConfig | null {
  const node = getStoryNode(phase);
  if (!node?.options?.length) return null;
  return node.options.find(option => option.id === optionId) ?? null;
}

export function mergeGraphOptionsWithGeneratedOptions(
  canonicalOptions: Array<{
    id: string;
    label: string;
    next_phase?: number | null;
    trust_delta?: number;
    affection_delta?: number;
    metadata?: Record<string, unknown> | string;
  }>,
  generatedOptions: Array<{
    id: string;
    label: string;
    next_phase?: number | null;
    trust_delta?: number;
    affection_delta?: number;
    metadata?: Record<string, unknown> | string;
  }>
) {
  if (!canonicalOptions.length) return [];

  const generatedById = new Map(
    generatedOptions
      .filter(option => option && typeof option.id === 'string')
      .map(option => [option.id, option] as const)
  );

  return canonicalOptions.map((canonicalOption, index) => {
    const generatedOption = generatedById.get(canonicalOption.id) ?? generatedOptions[index];
    const generatedLabel = typeof generatedOption?.label === 'string' ? generatedOption.label.trim() : '';
    const generatedMetadata = generatedOption?.metadata;

    return {
      ...canonicalOption,
      label: generatedLabel || canonicalOption.label,
      metadata: generatedMetadata ?? canonicalOption.metadata ?? {},
    };
  });
}

export function advanceStoryFromNode(
  state: GameState,
  llmResponse: any,
  isGameOver: boolean,
  selectedOptionId?: string
): StoryAdvanceResult {
  if (isGameOver) {
    return {
      storyPhase: state.storyPhase,
      turn_count: state.turn_count,
      isGameOver: true,
      gameOverType: state.gameOverType || '',
    };
  }

  const currentNode = getStoryNode(state.storyPhase) ?? getStoryNode(storyGraph.startPhase);
  if (!currentNode) {
    return {
      storyPhase: state.storyPhase,
      turn_count: (state.turn_count || 1) + 1,
      isGameOver: false,
      gameOverType: '',
    };
  }

  let nextPhase = currentNode.fallbackTo ?? state.storyPhase;
  let nextIsGameOver = false;
  let nextGameOverType = '';
  let selectedOptionResolved = false;

  if (selectedOptionId) {
    const option = resolveGraphOption(state.storyPhase, selectedOptionId);
    if (option) {
      nextPhase = option.targetPhase;
      nextIsGameOver = Boolean(option.isGameOver);
      nextGameOverType = resolveGameOverType(option.gameOverType, state);
      selectedOptionResolved = true;
    }
  }

  if (!selectedOptionResolved) {
    const matchedTransition = currentNode.transitions.find(transition =>
      transition.when.every(condition => evaluateCondition(condition, state, llmResponse))
    );
    const transition = matchedTransition ?? (typeof currentNode.fallbackTo === 'number' ? { to: currentNode.fallbackTo } : undefined);

    nextPhase = transition?.to ?? state.storyPhase;
    nextIsGameOver = Boolean(transition?.isGameOver);
    nextGameOverType = resolveGameOverType(transition?.gameOverType, state);
  }

  return {
    storyPhase: nextPhase,
    turn_count: (state.turn_count || 1) + 1,
    isGameOver: nextIsGameOver,
    gameOverType: nextGameOverType,
  };
}
