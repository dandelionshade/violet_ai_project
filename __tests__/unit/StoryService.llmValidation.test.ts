import test from 'node:test';
import assert from 'node:assert/strict';
import { StoryService } from '../../server/services/StoryService';

test('validateLLMResponse returns valid for well-formed response', () => {
  const llm = {
    reply_zh: '好的，我会写信。',
    reply_en: 'Understood.',
    reply_ja: 'かしこまりました。',
    emotion: 'thoughtful',
    suggested_options_zh: [
      { label: '继续', next_phase: 3, trust_delta: 1, affection_delta: 2, metadata: { hint: 'ask_more' } },
      { label: '离开邮局', next_phase: 1, trust_delta: 0, affection_delta: 0 }
    ],
    suggested_options_en: [
      { label: 'Continue', next_phase: 3, trust_delta: 1, affection_delta: 2 },
      { label: 'Leave the post office', next_phase: 1, trust_delta: 0, affection_delta: 0 }
    ],
    resonance_change: 1,
    favorability_change: 5,
    ready_to_draft: false,
  };

  const res = StoryService.validateLLMResponse(llm as any, { storyPhase: 2 });
  assert.equal(res.valid, true);
  assert.equal(res.sanitized.reply_zh, llm.reply_zh);
  assert.equal(res.sanitized.emotion, 'thoughtful');
  assert.equal(Array.isArray(res.sanitized.suggested_options_zh), true);
  assert.equal(res.sanitized.suggested_options_zh[0].next_phase, 3);
  assert.equal(res.sanitized.suggested_options_zh[0].trust_delta, 1);
  assert.equal(res.sanitized.suggested_options_zh[0].id, res.sanitized.suggested_options_en[0].id);
  assert.equal(res.sanitized.suggested_options_zh[0].id, 'phase_2_opt_1');
});

test('validateLLMResponse sanitizes malformed response and marks invalid', () => {
  const llm: any = {
    reply_zh: 123,
    reply_en: null,
    // missing reply_ja
    emotion: 'angry',
    suggested_options_zh: 'not-an-array',
    resonance_change: 5,
    favorability_change: 'not-a-number',
  };

  const res = StoryService.validateLLMResponse(llm);
  assert.equal(res.valid, false);
  assert.equal(res.sanitized.reply_zh, '');
  assert.equal(res.sanitized.reply_ja, '');
  assert.equal(res.sanitized.emotion, 'neutral');
  assert.deepEqual(res.sanitized.suggested_options_zh, []);
  assert.equal(res.sanitized.resonance_change, 0);
  assert.equal(res.sanitized.favorability_change, 0);
});
