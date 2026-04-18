import express from "express"; // 引入 Express 框架，用于搭建后端服务器
import path from "path"; // 引入 path 模块，用于处理文件路径
import { createServer as createViteServer } from "vite"; // 引入 Vite，用于在开发环境下提供前端热更新和构建服务
import { fileURLToPath } from "url"; // 引入 url 模块，用于处理 ES 模块下的路径问题
import { GoogleGenAI, Type } from "@google/genai"; // 引入 Google Gemini 的官方 SDK
import OpenAI from "openai"; // 引入 OpenAI 的官方 SDK，用于调用兼容 OpenAI 格式的接口（如 DeepSeek）
import dotenv from "dotenv"; // 引入 dotenv，用于读取 .env 文件中的环境变量
import { StoryManager } from "./server/StoryManager.ts"; // 引入剧情管理器
import type { GameState } from "./src/types/game.ts"; // 引入通用类型定义
import { ServerVectorDB } from "./server/VectorDB.ts";

// 强制加载并覆盖环境变量，确保 .env 文件中的配置生效
dotenv.config({ override: true });

// 辅助函数：数值钳位，确保数值在指定范围内
const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

// 状态已重构为无 stateless，由前端通过请求体传递
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 状态已重构为无状态 (Stateless)，由前端通过请求体传递

// 启动服务器的异步主函数
async function startServer() {
  const app = express(); // 创建一个 Express 应用实例
  const PORT = 3000; // 设置服务器监听的端口号为 3000

  // 配置 Express 解析 JSON 格式的请求体
  app.use(express.json());

  // 初始化 Gemini 客户端，传入 API 密钥
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  // 初始化 OpenAI 客户端（这里主要用来连接 DeepSeek）
  const openai = new OpenAI({
    baseURL: process.env.OPENAI_BASE_URL || "https://api.deepseek.com", // 优先使用环境变量中的地址，默认指向 DeepSeek 官方接口
    apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY, // 优先使用 DeepSeek 的 Key
  });

// 定义后端的聊天 API 路由，前端会向这里发送 POST 请求
  app.post("/api/chat", async (req, res) => {
    // 从请求体中解构出用户的消息、重置标志以及前端传来的当前状态
    const { message, reset } = req.body;
    const state = req.body.state as GameState;
    const playerName = state?.playerName || 'default_user';

    // RAG 核心：在服务器端检索相关历史记忆
    let relevantMemories: string[] = [];
    if (message) {
      try {
        const embedRes = await ai.models.embedContent({
          model: "gemini-embedding-2-preview",
          contents: message,
        });
        const queryEmbedding = embedRes.embeddings?.[0]?.values || [];
        if (queryEmbedding.length > 0) {
          relevantMemories = ServerVectorDB.search(playerName, queryEmbedding);
          // 将当前消息作为新记忆存入服务器向量数据库
          ServerVectorDB.addMemory(playerName, message, queryEmbedding);
        }
      } catch (e) {
        console.warn("Server RAG embedding failed:", e);
      }
    }

    // 数值钳位逻辑：确保传入状态的数值在合理范围内
    let trust = clamp(state?.trust || 10, 0, 100);
    let affection = clamp(state?.affection || 10, 0, 100);
    let turn_count = state?.turn_count || 1;
    let storyPhase = state?.storyPhase || 1;
    let chatHistory = state?.chatHistory || [];
    let openAiHistory = state?.openAiHistory || [];

    // 如果前端请求重置游戏
    if (reset) {
      return res.json({ status: "ok", turn_count: 1, storyPhase: 1, chatHistory: [], openAiHistory: [] }); // 返回初始状态
    }

    // 触发提前结束的条件：如果用户发送了包含 "离开邮局" 的消息
    if (message && message.includes("离开邮局")) {
      const earlyResponse = StoryManager.getEarlyEndingResponse();
      return res.json({
        ...earlyResponse,
        turn_count: 1,
        storyPhase: 1,
        chatHistory: [],
        openAiHistory: []
      });
    }

    // 预处理状态：确保传入 Prompt 生成器的核心数值已钳位
    const sanitizedState: GameState = {
      ...state,
      trust,
      affection,
      storyPhase,
      turn_count
    };

    // 从 StoryManager 获取当前阶段的系统提示词和游戏结束状态
    const { prompt: systemPrompt, isGameOver: promptIsGameOver, gameOverType: promptGameOverType } = StoryManager.getSystemPrompt(
      sanitizedState, 
      relevantMemories
    );

    // 从环境变量中读取当前激活的 LLM 模型，默认为 deepseek
    const activeLLM = process.env.ACTIVE_LLM || "deepseek";

    try {
      let jsonResponse; // 用于存储 AI 返回并解析后的 JSON 数据

      // 如果当前使用的是 Gemini 模型
      if (activeLLM === "gemini") {
        // 定义 Gemini 强制返回的 JSON 结构 (Schema)
        const responseSchema = {
          type: Type.OBJECT,
          properties: {
            reply_ja: { type: Type.STRING, description: "薇尔莉特的日文回复" },
            reply_zh: { type: Type.STRING, description: "薇尔莉特的中文翻译回复" },
            reply_en: { type: Type.STRING, description: "薇尔莉特的英文翻译回复" },
            emotion: { type: Type.STRING, description: "当前情绪状态: smile, sad, neutral, surprised, thoughtful, 或 crying" },
            suggested_options_ja: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "2-3个供玩家选择的日文回复选项"
            },
            suggested_options_zh: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "2-3个供玩家选择的中文回复选项"
            },
            suggested_options_en: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "2-3个供玩家选择的英文回复选项"
            },
            resonance_change: {
              type: Type.INTEGER,
              description: "根据玩家回复的真诚度/脆弱度，共鸣度的变化值 (-1, 0, 或 1)"
            },
            favorability_change: {
              type: Type.INTEGER,
              description: "根据玩家对你的关心程度，好感度的变化值 (-10 到 25)"
            },
            memory_summary: {
              type: Type.STRING,
              description: "（仅在游戏结束时提供）用一句话总结玩家的核心烦恼，用于跨周目记忆"
            },
            letter_tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "（仅在生成信件时提供）为这封信生成1-3个主题标签，例如 'Romance', 'Grief', 'Family', 'Career' 等"
            },
            ready_to_draft: {
              type: Type.BOOLEAN,
              description: "是否已经充分了解客户心意，可以开始询问信件风格了？"
            },
            refusal: {
              type: Type.BOOLEAN,
              description: "客户是否提出了恶意、色情或违法的要求？"
            }
          },
          required: ["reply_ja", "reply_zh", "reply_en", "emotion", "suggested_options_ja", "suggested_options_zh", "suggested_options_en", "resonance_change", "favorability_change", "ready_to_draft", "refusal"]
        };

        // 调用 Gemini API 生成内容
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-preview",
          contents: [...chatHistory, { role: "user", parts: [{ text: message || "你好" }] }], // 拼接历史记录和当前消息
          config: {
            systemInstruction: systemPrompt, // 传入系统提示词
            responseMimeType: "application/json", // 要求返回 JSON 格式
            responseSchema: responseSchema, // 传入 Schema
          }
        });

        const responseText = response.text;
        if (!responseText) throw new Error("Empty response from Gemini"); // 如果返回为空则抛出错误
        
        jsonResponse = JSON.parse(responseText); // 将返回的字符串解析为 JSON 对象

        // 将本轮对话保存到 Gemini 的历史记录中
        chatHistory.push({ role: "user", parts: [{ text: message || "你好" }] });
        chatHistory.push({ role: "model", parts: [{ text: jsonResponse.reply_zh || jsonResponse.reply }] });

      } else {
        // 如果使用的是 DeepSeek 或其他兼容 OpenAI 格式的模型
        
        // 更新或插入系统提示词到历史记录的第一项
        if (openAiHistory.length === 0) {
           openAiHistory.push({ role: "system", content: systemPrompt });
        } else {
           openAiHistory[0] = { role: "system", content: systemPrompt };
        }
        
        const userMessage = message || "你好";
        openAiHistory.push({ role: "user", content: userMessage }); // 将用户消息加入历史记录

        // 调用 OpenAI/DeepSeek API 生成内容
        const response = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || "deepseek-chat", // 使用环境变量指定的模型
          messages: openAiHistory, // 传入完整的历史记录
          response_format: { type: "json_object" }, // 强制要求返回 JSON 格式
        });

        const responseText = response.choices[0].message.content;
        if (!responseText) throw new Error("Empty response from DeepSeek"); // 如果返回为空则抛出错误
        
        jsonResponse = JSON.parse(responseText); // 将返回的字符串解析为 JSON 对象

        // 将 AI 的回复加入历史记录
        openAiHistory.push({ role: "assistant", content: responseText });
      }

      let isGameOver = promptIsGameOver;
      let gameOverType = promptGameOverType;

      // 如果游戏未结束，根据 AI 的判断和当前阶段推进剧情
      if (!isGameOver) {
        if (jsonResponse.refusal) {
          storyPhase = 6; // REFUSAL
          isGameOver = true;
          gameOverType = "refusal";
        } else if (storyPhase === 1) {
          storyPhase = 2;
        } else if (storyPhase === 2) {
          storyPhase = 3;
        } else if (storyPhase === 3) {
          if (jsonResponse.ready_to_draft) {
            storyPhase = 4; // DRAFTING
          }
        } else if (storyPhase === 4) {
          storyPhase = 5; // DELIVERY
        }
        turn_count++; // 轮数始终加一，代表对话回合数
      }

      // 核心数值计算与钳位：在返回给前端前，计算并确保数值不越界
      const finalTrust = clamp(trust + (jsonResponse.resonance_change || 0), 0, 100);
      const finalAffection = clamp(affection + (jsonResponse.favorability_change || 0), 0, 100);

      // 将 AI 的回复以及更新后的游戏状态返回给前端
      res.json({
        ...jsonResponse,
        trust: finalTrust,
        affection: finalAffection,
        isGameOver,
        gameOverType,
        turn_count,
        storyPhase,
        chatHistory,
        openAiHistory
      });

    } catch (error) {
      // 捕获并打印错误
      console.error("LLM API Error:", error);
      res.status(500).json({ error: "Failed to generate response" }); // 向前端返回 500 错误状态
    }
  });

  // 定义 TTS 接口
  app.post("/api/tts", async (req, res) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    try {
      // 动态导入 node-edge-tts
      const { EdgeTTS } = await import('node-edge-tts');
      const tts = new EdgeTTS({
        voice: 'ja-JP-NanamiNeural', // 微软 Edge TTS 中的高质量日文女声
        lang: 'ja-JP',
        pitch: '+10Hz', // 稍微调高音调
        rate: '-10%',   // 稍微放慢语速，符合薇尔莉特的人设
        volume: '+0%'
      });

      // 生成临时文件路径
      const { randomUUID } = await import('crypto');
      const fs = await import('fs');
      const os = await import('os');
      const path = await import('path');
      
      const tempFilePath = path.join(os.tmpdir(), `${randomUUID()}.mp3`);

      // 生成音频并保存到临时文件
      await tts.ttsPromise(text, tempFilePath);

      // 读取文件并发送给前端
      const audioBuffer = fs.readFileSync(tempFilePath);
      
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(audioBuffer);

      // 删除临时文件
      fs.unlinkSync(tempFilePath);
      
    } catch (error) {
      console.error("TTS Error:", error);
      res.status(500).json({ error: "Failed to generate TTS" });
    }
  });

  // Vite 中间件配置：用于在开发环境下处理前端代码
  if (process.env.NODE_ENV !== "production") {
    // 如果不是生产环境，启动 Vite 的中间件模式
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa", // 单页应用模式
    });
    app.use(vite.middlewares); // 让 Express 使用 Vite 的中间件
  } else {
    // 如果是生产环境，直接提供 dist 目录下的静态文件
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // 所有未匹配的路由都返回 index.html，交给前端路由处理
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // 启动服务器，监听 0.0.0.0 以允许外部访问
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// 执行启动函数
startServer();
