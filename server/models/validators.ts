import type { ChatRequest, TTSRequest } from './types';

export interface ValidationResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function validateChatRequest(input: unknown): ValidationResult<ChatRequest> {
  if (!isObject(input)) {
    return { ok: false, error: 'Request body must be an object' };
  }

  const { message, state, reset } = input;

  if (typeof message !== 'string' || message.trim().length === 0) {
    return { ok: false, error: 'message must be a non-empty string' };
  }

  if (!isObject(state)) {
    return { ok: false, error: 'state is required and must be an object' };
  }

  const requiredStateKeys = ['turn_count', 'storyPhase', 'trust', 'affection'];
  const hasMissingKey = requiredStateKeys.some(key => !(key in state));
  if (hasMissingKey) {
    return { ok: false, error: 'state is missing required fields' };
  }

  if (typeof reset !== 'undefined' && typeof reset !== 'boolean') {
    return { ok: false, error: 'reset must be a boolean when provided' };
  }

  const chatRequest: ChatRequest = {
    message,
    state: state as unknown as ChatRequest['state'],
    reset: typeof reset === 'boolean' ? reset : undefined,
  };

  return { ok: true, data: chatRequest };
}

export function validateTTSRequest(input: unknown): ValidationResult<TTSRequest> {
  if (!isObject(input)) {
    return { ok: false, error: 'Request body must be an object' };
  }

  const { text } = input;
  if (typeof text !== 'string' || text.trim().length === 0) {
    return { ok: false, error: 'text must be a non-empty string' };
  }

  return {
    ok: true,
    data: {
      text: text.trim(),
    },
  };
}
