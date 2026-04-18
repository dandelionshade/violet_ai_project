import test from 'node:test';
import assert from 'node:assert/strict';
import { LLMService } from '../../server/services/LLMService';

function baseResponse() {
  return {
    reply_ja: 'ja',
    reply_zh: 'zh',
    reply_en: 'en',
    emotion: 'neutral',
    suggested_options_ja: ['a'],
    suggested_options_zh: ['b'],
    suggested_options_en: ['c'],
    resonance_change: 1,
    favorability_change: 2,
    ready_to_draft: false,
    refusal: false,
  };
}

test('LLMService normalize should fallback on invalid shape', () => {
  const normalized = (LLMService as any).normalizeResponse(
    {
      reply_ja: 1,
      suggested_options_ja: [1, 'ok', true],
      resonance_change: 'oops',
    },
    '测试消息'
  );

  assert.match(normalized.reply_zh, /测试消息/);
  assert.equal(normalized.emotion, 'neutral');
  assert.deepEqual(normalized.suggested_options_ja, ['ok']);
  assert.equal(normalized.resonance_change, 0);
});

test('LLMService generateWithOpenAI should retry then succeed', async () => {
  let callCount = 0;

  const originalGemini = (LLMService as any).gemini;
  const originalOpenai = (LLMService as any).openai;

  (LLMService as any).gemini = {};
  (LLMService as any).openai = {
    chat: {
      completions: {
        create: async () => {
          callCount += 1;
          if (callCount === 1) {
            throw new Error('transient');
          }

          return {
            choices: [
              {
                message: {
                  content: JSON.stringify(baseResponse()),
                },
              },
            ],
          };
        },
      },
    },
  };

  try {
    const result = await LLMService.generateWithOpenAI('system', [], 'hello', 2);
    assert.equal(callCount, 2);
    assert.equal(result.reply_zh, 'zh');
    assert.equal(result.favorability_change, 2);
  } finally {
    (LLMService as any).gemini = originalGemini;
    (LLMService as any).openai = originalOpenai;
  }
});

test('LLMService generateEmbedding should throw on empty embedding', async () => {
  const originalGemini = (LLMService as any).gemini;
  const originalOpenai = (LLMService as any).openai;

  (LLMService as any).gemini = {
    models: {
      embedContent: async () => ({ embeddings: [{ values: [] }] }),
    },
  };
  (LLMService as any).openai = {};

  try {
    await assert.rejects(() => LLMService.generateEmbedding('hello'));
  } finally {
    (LLMService as any).gemini = originalGemini;
    (LLMService as any).openai = originalOpenai;
  }
});
