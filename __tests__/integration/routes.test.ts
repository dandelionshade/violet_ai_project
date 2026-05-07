import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';

import chatRoutes from '../../server/routes/chat';
import ttsRoutes from '../../server/routes/tts';
import healthRoutes from '../../server/routes/health';
import { LLMService } from '../../server/services/LLMService';
import { MemoryService } from '../../server/services/MemoryService';
import { StoryService } from '../../server/services/StoryService';
import { requestLogger } from '../../server/middleware/logger';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(requestLogger);
  app.use('/api', healthRoutes);
  app.use('/api', ttsRoutes);
  app.use('/api', chatRoutes);
  return app;
}

test('GET /api/health should return ok response', async () => {
  const app = createTestApp();
  const res = await request(app).get('/api/health');

  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
  assert.equal(typeof res.body.timestamp, 'string');
  assert.equal(typeof res.headers['x-request-id'], 'string');
});

test('POST /api/tts should reject invalid body', async () => {
  const app = createTestApp();
  const res = await request(app).post('/api/tts').send({ text: '' });

  assert.equal(res.status, 400);
  assert.equal(res.body.error?.code, 'VALIDATION_ERROR');
});

test('POST /api/chat should reject invalid body before service calls', async () => {
  const app = createTestApp();
  const res = await request(app).post('/api/chat').send({ message: 'hi' });

  assert.equal(res.status, 400);
  assert.equal(res.body.error?.code, 'VALIDATION_ERROR');
});

test('POST /api/chat should progress state with mocked LLM response', async () => {
  const app = createTestApp();

  const originalRetrieve = MemoryService.retrieveRelevantMemories;
  const originalSaveMemory = MemoryService.saveMemory;
  const originalGetSystemPrompt = StoryService.getSystemPrompt;
  const originalAdvance = StoryService.advanceGameState;
  const originalCalculate = StoryService.calculateFinalValues;
  const originalGenerateOpenAI = LLMService.generateWithOpenAI;

  MemoryService.retrieveRelevantMemories = async () => ['past memory'];
  MemoryService.saveMemory = async () => {};
  StoryService.getSystemPrompt = () => ({
    prompt: 'system prompt',
    isGameOver: false,
    gameOverType: '',
  } as any);
  StoryService.advanceGameState = () => ({
    storyPhase: 2,
    turn_count: 2,
    isGameOver: false,
    gameOverType: '',
  });
  StoryService.calculateFinalValues = () => ({ trust: 20, affection: 25 });
  LLMService.generateWithOpenAI = async () => ({
    reply_ja: 'こんにちは',
    reply_zh: '你好',
    reply_en: 'hello',
    emotion: 'neutral',
    suggested_options_ja: [ { id: 'ja1', label: 'はい', next_phase: 2, trust_delta: 1, affection_delta: 1 } ],
    suggested_options_zh: [ { id: 'zh1', label: '好', next_phase: 2, trust_delta: 1, affection_delta: 1 } ],
    suggested_options_en: [ { id: 'en1', label: 'ok', next_phase: 2, trust_delta: 1, affection_delta: 1 } ],
    resonance_change: 1,
    favorability_change: 2,
    ready_to_draft: false,
    refusal: false,
  });

  try {
    const res = await request(app).post('/api/chat').send({
      message: '测试消息',
      selected_option_id: 'zh1',
      state: {
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
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.reply_zh, '你好');
    assert.equal(res.body.storyPhase, 2);
    assert.equal(res.body.turn_count, 2);
    assert.equal(res.body.trust, 20);
    assert.equal(res.body.affection, 25);
  } finally {
    MemoryService.retrieveRelevantMemories = originalRetrieve;
    MemoryService.saveMemory = originalSaveMemory;
    StoryService.getSystemPrompt = originalGetSystemPrompt;
    StoryService.advanceGameState = originalAdvance;
    StoryService.calculateFinalValues = originalCalculate;
    LLMService.generateWithOpenAI = originalGenerateOpenAI;
  }
});

test('POST /api/chat should return 500 when LLM throws', async () => {
  const app = createTestApp();

  const originalGenerateOpenAI = LLMService.generateWithOpenAI;
  const originalRetrieve = MemoryService.retrieveRelevantMemories;

  MemoryService.retrieveRelevantMemories = async () => [];
  LLMService.generateWithOpenAI = async () => {
    throw new Error('mock llm failure');
  };

  try {
    const res = await request(app).post('/api/chat').send({
      message: '测试消息',
      state: {
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
      },
    });

    assert.equal(res.status, 500);
    assert.equal(res.body.error, 'Failed to generate response');
    assert.match(res.body.details, /mock llm failure/);
  } finally {
    LLMService.generateWithOpenAI = originalGenerateOpenAI;
    MemoryService.retrieveRelevantMemories = originalRetrieve;
  }
});
