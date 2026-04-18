import test from 'node:test';
import assert from 'node:assert/strict';
import { StoryService } from '../../server/services/StoryService';
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

  assert.equal(result.storyPhase, 6);
  assert.equal(result.isGameOver, true);
  assert.equal(result.gameOverType, 'refusal');
  assert.equal(result.turn_count, 2);
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
