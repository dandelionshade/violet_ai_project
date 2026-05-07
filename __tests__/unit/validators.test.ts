import test from 'node:test';
import assert from 'node:assert/strict';
import { validateChatRequest, validateTTSRequest } from '../../server/models/validators';

test('validateChatRequest should reject missing state', () => {
  const result = validateChatRequest({ message: 'hello' });
  assert.equal(result.ok, false);
  assert.match(result.error || '', /state/i);
});

test('validateChatRequest should accept valid payload', () => {
  const result = validateChatRequest({
    message: 'hello',
    reset: false,
    state: {
      turn_count: 1,
      storyPhase: 1,
      trust: 10,
      affection: 10,
    },
  });

  assert.equal(result.ok, true);
});

test('validateChatRequest should reject non-numeric state fields', () => {
  const result = validateChatRequest({
    message: 'hello',
    state: {
      turn_count: '1',
      storyPhase: 1,
      trust: 10,
      affection: 10,
    },
  });

  assert.equal(result.ok, false);
  assert.match(result.error || '', /numeric/i);
});

test('validateTTSRequest should reject empty text', () => {
  const result = validateTTSRequest({ text: '   ' });
  assert.equal(result.ok, false);
});

test('validateTTSRequest should trim valid text', () => {
  const result = validateTTSRequest({ text: '  你好  ' });
  assert.equal(result.ok, true);
  assert.equal(result.data?.text, '你好');
});
