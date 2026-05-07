/**
 * LLM 服务通用层
 * 封装 Gemini 和 OpenAI/DeepSeek 的调用逻辑
 * 统一处理重试、错误降级、响应校验
 */

import { GoogleGenAI, Type } from '@google/genai';
import OpenAI from 'openai';
import type { LLMResponse, Option } from '../models/types';

export class LLMService {
  private static gemini: GoogleGenAI | null = null;
  private static openai: OpenAI | null = null;

  static initialize() {
    if (!this.gemini) {
      this.gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }

    if (!this.openai) {
      this.openai = new OpenAI({
        baseURL: process.env.OPENAI_BASE_URL || 'https://api.deepseek.com',
        apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
      });
    }
  }

  /**
   * 调用 Gemini API 生成 JSON 响应
   */
  static async generateWithGemini(
    systemPrompt: string,
    chatHistory: any[],
    userMessage: string,
    maxRetries = 3
  ): Promise<LLMResponse> {
    this.initialize();

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        reply_ja: { type: Type.STRING, description: '薇尔莉特的日文回复' },
        reply_zh: { type: Type.STRING, description: '薇尔莉特的中文翻译回复' },
        reply_en: { type: Type.STRING, description: '薇尔莉特的英文翻译回复' },
        emotion: {
          type: Type.STRING,
          description:
            '当前情绪状态: smile, sad, neutral, surprised, thoughtful, 或 crying',
        },
        suggested_options_ja: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: '选项的稳定ID' },
              label: { type: Type.STRING, description: '按钮显示文本' },
              next_phase: { type: Type.INTEGER, description: '可选，下一个剧情阶段' },
              trust_delta: { type: Type.INTEGER, description: '可选，信任变化' },
              affection_delta: { type: Type.INTEGER, description: '可选，好感变化' },
            },
            required: ['id', 'label'],
          },
          description: '2-3个供玩家选择的日文回复选项（对象数组）',
        },
        suggested_options_zh: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: '选项的稳定ID' },
              label: { type: Type.STRING, description: '按钮显示文本' },
              next_phase: { type: Type.INTEGER, description: '可选，下一个剧情阶段' },
              trust_delta: { type: Type.INTEGER, description: '可选，信任变化' },
              affection_delta: { type: Type.INTEGER, description: '可选，好感变化' },
            },
            required: ['id', 'label'],
          },
          description: '2-3个供玩家选择的中文回复选项（对象数组）',
        },
        suggested_options_en: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: '选项的稳定ID' },
              label: { type: Type.STRING, description: '按钮显示文本' },
              next_phase: { type: Type.INTEGER, description: '可选，下一个剧情阶段' },
              trust_delta: { type: Type.INTEGER, description: '可选，信任变化' },
              affection_delta: { type: Type.INTEGER, description: '可选，好感变化' },
            },
            required: ['id', 'label'],
          },
          description: '2-3个供玩家选择的英文回复选项（对象数组）',
        },
        resonance_change: {
          type: Type.INTEGER,
          description: '根据玩家回复的真诚度/脆弱度，共鸣度的变化值 (-1, 0, 或 1)',
        },
        favorability_change: {
          type: Type.INTEGER,
          description: '根据玩家对你的关心程度，好感度的变化值 (-10 到 25)',
        },
        memory_summary: {
          type: Type.STRING,
          description: '（仅在游戏结束时提供）用一句话总结玩家的核心烦恼，用于跨周目记忆',
        },
        letter_tags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            '（仅在生成信件时提供）为这封信生成1-3个主题标签，例如 "Romance", "Grief", "Family", "Career" 等',
        },
        ready_to_draft: {
          type: Type.BOOLEAN,
          description: '是否已经充分了解客户心意，可以开始询问信件风格了？',
        },
        refusal: {
          type: Type.BOOLEAN,
          description: '客户是否提出了恶意、色情或违法的要求？',
        },
      },
      required: [
        'reply_ja',
        'reply_zh',
        'reply_en',
        'emotion',
        'suggested_options_ja',
        'suggested_options_zh',
        'suggested_options_en',
        'resonance_change',
        'favorability_change',
        'ready_to_draft',
        'refusal',
      ],
    };

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.gemini!.models.generateContent({
          model: 'gemini-3.1-flash-preview',
          contents: [...chatHistory, { role: 'user', parts: [{ text: userMessage || '你好' }] }],
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
          },
        });

        const responseText = response.text;
        if (!responseText) throw new Error('Empty response from Gemini');

        const jsonResponse = JSON.parse(responseText);
        return this.normalizeResponse(jsonResponse, userMessage);
      } catch (error) {
        console.error(`[LLM] Gemini attempt ${attempt + 1} failed:`, error);
        if (attempt === maxRetries - 1) throw error;
        // 指数退避
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new Error('Failed to generate response from Gemini after max retries');
  }

  /**
   * 调用 OpenAI/DeepSeek API 生成 JSON 响应
   */
  static async generateWithOpenAI(
    systemPrompt: string,
    openAiHistory: any[],
    userMessage: string,
    maxRetries = 3
  ): Promise<LLMResponse> {
    this.initialize();

    // 确保系统提示词在历史记录的第一项
    const history = [...openAiHistory];
    if (history.length === 0) {
      history.push({ role: 'system', content: systemPrompt });
    } else {
      history[0] = { role: 'system', content: systemPrompt };
    }

    history.push({ role: 'user', content: userMessage || '你好' });

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.openai!.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'deepseek-chat',
          messages: history,
          response_format: { type: 'json_object' },
        });

        const responseText = response.choices[0].message.content;
        if (!responseText) throw new Error('Empty response from OpenAI');

        const jsonResponse = JSON.parse(responseText);
        return this.normalizeResponse(jsonResponse, userMessage);
      } catch (error) {
        console.error(`[LLM] OpenAI attempt ${attempt + 1} failed:`, error);
        if (attempt === maxRetries - 1) throw error;
        // 指数退避
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new Error('Failed to generate response from OpenAI after max retries');
  }

  /**
   * 将 LLM 响应归一化为可安全消费的结构
   */
  private static normalizeResponse(response: any, userMessage: string): LLMResponse {
    const fallbackReply = userMessage?.trim() ? `我明白了。关于「${userMessage.trim()}」，我会继续倾听。` : '我明白了。请继续。';

    const normalizeOptions = (value: unknown): Option[] => {
      if (!Array.isArray(value)) return [];
      return value.slice(0, 3).map((item: unknown, index: number) => {
        if (typeof item === 'string') {
          const label = item.trim();
          return {
            id: label ? label.replace(/\s+/g, '_') : `opt_${index + 1}`,
            label,
          };
        }

        if (item && typeof item === 'object') {
          const candidate = item as Partial<Option>;
          const label = typeof candidate.label === 'string' ? candidate.label : String(candidate.id ?? '').trim();
          return {
            id: typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id : (label ? label.replace(/\s+/g, '_') : `opt_${index + 1}`),
            label,
            next_phase: typeof candidate.next_phase === 'number' ? candidate.next_phase : null,
            trust_delta: typeof candidate.trust_delta === 'number' ? candidate.trust_delta : 0,
            affection_delta: typeof candidate.affection_delta === 'number' ? candidate.affection_delta : 0,
            metadata: candidate.metadata,
          };
        }

        return {
          id: `opt_${index + 1}`,
          label: '',
          next_phase: null,
          trust_delta: 0,
          affection_delta: 0,
        };
      });
    };

    const toNumber = (value: unknown, fallback: number): number => {
      return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
    };

    return {
      reply_ja: typeof response?.reply_ja === 'string' ? response.reply_ja : fallbackReply,
      reply_zh: typeof response?.reply_zh === 'string' ? response.reply_zh : fallbackReply,
      reply_en: typeof response?.reply_en === 'string' ? response.reply_en : fallbackReply,
      emotion: typeof response?.emotion === 'string' ? response.emotion : 'neutral',
      suggested_options_ja: normalizeOptions(response?.suggested_options_ja),
      suggested_options_zh: normalizeOptions(response?.suggested_options_zh),
      suggested_options_en: normalizeOptions(response?.suggested_options_en),
      resonance_change: toNumber(response?.resonance_change, 0),
      favorability_change: toNumber(response?.favorability_change, 0),
      ready_to_draft: Boolean(response?.ready_to_draft),
      refusal: Boolean(response?.refusal),
      memory_summary: typeof response?.memory_summary === 'string' ? response.memory_summary : undefined,
      letter_tags: Array.isArray(response?.letter_tags)
        ? response.letter_tags.filter((item: unknown) => typeof item === 'string')
        : undefined,
    };
  }

  /**
   * 生成文本嵌入向量（用于 RAG）
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    this.initialize();

    try {
      const response = await this.gemini!.models.embedContent({
        model: 'gemini-embedding-2-preview',
        contents: text,
      });

      const embedding = response.embeddings?.[0]?.values || [];
      if (embedding.length === 0) {
        throw new Error('Empty embedding from Gemini');
      }

      return embedding;
    } catch (error) {
      console.error('[LLM] Failed to generate embedding:', error);
      throw error;
    }
  }
}
