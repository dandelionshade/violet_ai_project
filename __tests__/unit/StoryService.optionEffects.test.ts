/*
 * @Author: zhen doniajohary2677@gmail.com
 * @Date: 2026-05-03 19:16:25
 * @LastEditors: zhen doniajohary2677@gmail.com
 * @LastEditTime: 2026-05-05 20:31:19
 * @FilePath: \violet_ai_project\__tests__\unit\StoryService.optionEffects.test.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { StoryService } from '../../server/services/StoryService';
import { mergeGraphOptionsWithGeneratedOptions } from '../../server/storyNodes';
import type { GameState } from '../../server/models/types';

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    turn_count: 1,
    storyPhase: 2,
    chatHistory: [],
    openAiHistory: [],
    emotion: 'neutral',
    reply: '',
    suggested_options: [],
    isGameOver: false,
    trust: 10,
    affection: 10,
    ...overrides,
  } as unknown as GameState;
}

test('applyOptionEffects applies deltas and phase change', () => {
  const state = baseState();
  const option = { id: 'o1', label: '深聊', next_phase: 3, trust_delta: 2, affection_delta: 5 };
  const newState = StoryService.applyOptionEffects(state, option);

  assert.equal(newState.trust, 12);
  assert.equal(newState.affection, 15);
  assert.equal(newState.storyPhase, 3);
  assert.equal(newState.turn_count, 2);
});

test('applyOptionEffects clamps values correctly', () => {
  const state = baseState({ trust: 99, affection: 98 });
  const option = { id: 'o2', label: '大增', trust_delta: 5, affection_delta: 10 };
  const newState = StoryService.applyOptionEffects(state, option);

  assert.equal(newState.trust, 100);
  assert.equal(newState.affection, 100);
});

test('applyOptionEffects handles missing fields gracefully', () => {
  const state = baseState({ trust: 5, affection: 5 });
  const option = { id: 'o3', label: '无效果' };
  const newState = StoryService.applyOptionEffects(state, option);

  assert.equal(newState.trust, 5);
  assert.equal(newState.affection, 5);
  assert.equal(newState.storyPhase, state.storyPhase);
  assert.equal(newState.turn_count, 2);
});

test('applyOptionEffects preserves zero-valued state', () => {
  const state = baseState({ trust: 0, affection: 0 });
  const option = { id: 'o4', label: '保持不变', trust_delta: 0, affection_delta: 0 };
  const newState = StoryService.applyOptionEffects(state, option);

  assert.equal(newState.trust, 0);
  assert.equal(newState.affection, 0);
});

test('mergeGraphOptionsWithGeneratedOptions keeps framework metadata while swapping labels', () => {
  const canonical = [
    { id: 'phase_15_opt_1', label: '我换一种问法。', next_phase: 3, trust_delta: 0, affection_delta: 0, metadata: { hint: 'pause' } },
    { id: 'phase_15_opt_2', label: '如果不方便，可以先不回答。', next_phase: 13, trust_delta: 1, affection_delta: 0, metadata: { hint: 'step back' } },
  ];
  const generated = [
    { id: 'phase_15_opt_1', label: '我再换个说法。', next_phase: 99, trust_delta: 9, affection_delta: 9, metadata: { hint: 'rewrite' } },
    { id: 'phase_15_opt_2', label: '如果这让您为难，可以先不回答。', next_phase: 88, trust_delta: -5, affection_delta: -5, metadata: { hint: 'soften' } },
  ];

  const merged = mergeGraphOptionsWithGeneratedOptions(canonical, generated);

  assert.equal(merged[0].label, '我再换个说法。');
  assert.equal(merged[0].next_phase, 3);
  assert.equal(merged[0].trust_delta, 0);
  assert.equal(merged[0].affection_delta, 0);
  assert.deepEqual(merged[0].metadata, { hint: 'rewrite' });
  assert.equal(merged[1].label, '如果这让您为难，可以先不回答。');
  assert.equal(merged[1].next_phase, 13);
  assert.equal(merged[1].trust_delta, 1);
  assert.equal(merged[1].affection_delta, 0);
});
