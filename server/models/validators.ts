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
  const selected_option_id = (input as any).selected_option_id;

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

  const requiredNumericStateKeys = ['turn_count', 'storyPhase', 'trust', 'affection'];
  const hasInvalidNumericState = requiredNumericStateKeys.some(key => {
    const value = (state as Record<string, unknown>)[key];
    return typeof value !== 'number' || !Number.isFinite(value);
  });
  if (hasInvalidNumericState) {
    return { ok: false, error: 'state numeric fields must be finite numbers' };
  }

  if (typeof reset !== 'undefined' && typeof reset !== 'boolean') {
    return { ok: false, error: 'reset must be a boolean when provided' };
  }

  if (typeof selected_option_id !== 'undefined' && typeof selected_option_id !== 'string') {
    return { ok: false, error: 'selected_option_id must be a string when provided' };
  }

  const chatRequest: ChatRequest = {
    message,
    state: state as unknown as ChatRequest['state'],
    reset: typeof reset === 'boolean' ? reset : undefined,
    selected_option_id: typeof selected_option_id === 'string' ? selected_option_id : undefined,
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
