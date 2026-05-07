import test from 'node:test';
import assert from 'node:assert/strict';
import { StoryService } from '../../server/services/StoryService';
import { getNodePresentation } from '../../server/storyNodes';
import type { GameState } from '../../server/models/types';

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    turn_count: 1,
    storyPhase: 1,
    chatHistory: [],
    openAiHistory: [],
    emotion: 'neutral',
    reply: '',
    suggested_options: [],
    isGameOver: false,
    trust: 10,
    affection: 10,
    ...overrides,
  };
}

test('StoryService.advanceGameState should move to refusal ending', () => {
  const state = baseState({ storyPhase: 3, affection: 40 });
  const result = StoryService.advanceGameState(state, { refusal: true }, false);

  assert.equal(result.storyPhase, 9);
  assert.equal(result.isGameOver, true);
  assert.equal(result.gameOverType, 'refusal');
  assert.equal(result.turn_count, 2);
});

test('StoryService.advanceGameState should move linearly from phase 1 to 2', () => {
  const state = baseState({ storyPhase: 1 });
  const result = StoryService.advanceGameState(state, {}, false);

  assert.equal(result.storyPhase, 2);
  assert.equal(result.isGameOver, false);
  assert.equal(result.turn_count, 2);
});

test('StoryService.advanceGameState should stay on phase 3 until ready_to_draft', () => {
  const state = baseState({ storyPhase: 3, trust: 5, affection: 25 });
  const stayResult = StoryService.advanceGameState(state, { ready_to_draft: false }, false);
  const advanceResult = StoryService.advanceGameState(state, { ready_to_draft: true }, false);

  assert.equal(stayResult.storyPhase, 3);
  assert.equal(stayResult.turn_count, 2);
  assert.equal(advanceResult.storyPhase, 4);
  assert.equal(advanceResult.turn_count, 2);
});

test('StoryService.advanceGameState should enter soft-failure recovery when trust is low', () => {
  const state = baseState({ storyPhase: 15, trust: 1, affection: 7 });
  const result = StoryService.advanceGameState(state, {}, false);

  assert.equal(result.storyPhase, 13);
  assert.equal(result.isGameOver, false);
  assert.equal(result.turn_count, 2);
});

test('StoryService.advanceGameState should use the lighter pause node for mild tension', () => {
  const state = baseState({ storyPhase: 3, trust: 3, affection: 18 });
  const result = StoryService.advanceGameState(state, {}, false);

  assert.equal(result.storyPhase, 15);
  assert.equal(result.isGameOver, false);
  assert.equal(result.turn_count, 2);
});

test('StoryService.advanceGameState should move from cooling off to repair and back to mainline', () => {
  const coolingState = baseState({ storyPhase: 13, trust: 3, affection: 14 });
  const coolingResult = StoryService.advanceGameState(coolingState, {}, false, 'phase_13_opt_1');
  assert.equal(coolingResult.storyPhase, 14);
  assert.equal(coolingResult.isGameOver, false);
  assert.equal(coolingResult.turn_count, 2);

  const repairState = baseState({ storyPhase: 14, trust: 5, affection: 22 });
  const repairResult = StoryService.advanceGameState(repairState, {}, false);
  assert.equal(repairResult.storyPhase, 3);
  assert.equal(repairResult.isGameOver, false);
  assert.equal(repairResult.turn_count, 2);
});

test('StoryService.advanceGameState should end at phase 7 with ending type based on affection', () => {
  const state = baseState({ storyPhase: 7, affection: 65 });
  const result = StoryService.advanceGameState(state, {}, false);

  assert.equal(result.storyPhase, 8);
  assert.equal(result.isGameOver, true);
  assert.equal(result.gameOverType, 'good_ending');
  assert.equal(result.turn_count, 2);
});

test('StoryService.advanceGameState should follow configured selected option target phase', () => {
  const state = baseState({ storyPhase: 3 });
  const result = StoryService.advanceGameState(state, {}, false, 'phase_3_opt_1');

  assert.equal(result.storyPhase, 4);
  assert.equal(result.isGameOver, false);
  assert.equal(result.turn_count, 2);
});

test('StoryService.advanceGameState should respect same-phase selected option without overriding it', () => {
  const state = baseState({ storyPhase: 12, trust: 10, affection: 40 });
  const result = StoryService.advanceGameState(state, {}, false, 'phase_12_opt_1');

  assert.equal(result.storyPhase, 12);
  assert.equal(result.isGameOver, false);
  assert.equal(result.turn_count, 2);
});

test('StoryService.advanceGameState should end after delivery-stage selected option', () => {
  const state = baseState({ storyPhase: 7, affection: 70 });
  const result = StoryService.advanceGameState(state, {}, false, 'phase_7_opt_1');

  assert.equal(result.storyPhase, 8);
  assert.equal(result.isGameOver, true);
  assert.equal(result.gameOverType, 'good_ending');
  assert.equal(result.turn_count, 2);
});

test('StoryService.advanceGameState should enter and exit side branch nodes', () => {
  const branchState = baseState({ storyPhase: 3, trust: 8, affection: 52 });
  const branchResult = StoryService.advanceGameState(branchState, {}, false, 'phase_3_opt_4');
  assert.equal(branchResult.storyPhase, 10);
  assert.equal(branchResult.isGameOver, false);
  assert.equal(branchResult.turn_count, 2);

  const returnState = baseState({ storyPhase: 10, trust: 8, affection: 52 });
  const returnResult = StoryService.advanceGameState(returnState, {}, false, 'phase_10_opt_2');
  assert.equal(returnResult.storyPhase, 4);
  assert.equal(returnResult.isGameOver, false);
  assert.equal(returnResult.turn_count, 2);
});

test('StoryService.calculateFinalValues should clamp trust and affection', () => {
  const state = baseState({ trust: 99, affection: 2 });
  const result = StoryService.calculateFinalValues(state, {
    resonance_change: 10,
    favorability_change: -10,
  });

  assert.equal(result.trust, 100);
  assert.equal(result.affection, 0);
});

test('getNodePresentation should classify branch and recovery nodes', () => {
  assert.equal(getNodePresentation(3, 'zh').nodeType, 'mainline');
  assert.equal(getNodePresentation(10, 'zh').nodeType, 'branch');
  assert.equal(getNodePresentation(13, 'zh').nodeType, 'recovery');
  assert.equal(getNodePresentation(15, 'zh').nodeType, 'pause');
  assert.equal(getNodePresentation(8, 'zh').nodeType, 'ending');
  assert.equal(getNodePresentation(9, 'zh').nodeType, 'refusal');
});

test('StoryService.getSystemPrompt should include node-type transition guidance when provided', () => {
  const state = baseState({ storyPhase: 3, storyNodeType: 'recovery' });
  const prompt = StoryService.getSystemPrompt(state, []).prompt;

  assert.match(prompt, /节点类型驱动的过渡句/);
  assert.match(prompt, /recovery/);
});
