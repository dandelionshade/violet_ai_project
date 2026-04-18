/**
 * 后端入口文件 (Refactored)
 * Express 应用的主入口，整合所有路由和中间件
 * 
 * 这个文件替代原来的 server.ts
 * 分层架构：路由 → 服务 → 模型
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { MemoryService } from './services/MemoryService';
import chatRoutes from './routes/chat';

// 加载环境变量
dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // ===== 中间件配置 =====
  app.use(express.json());

  // ===== 日志中间件 =====
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // ===== 初始化服务 =====
  try {
    console.log('[Init] Initializing memory service (Pinecone)...');
    await MemoryService.initialize();
    console.log('[Init] Memory service initialized successfully');
  } catch (error) {
    console.warn('[Init] Memory service initialization failed, continuing:', error);
    // 如果 Pinecone 初始化失败，继续启动服务器，仅记忆功能不可用
  }

  // ===== 路由配置 =====
  // 使用分层的路由
  app.use('/api', chatRoutes);

  // 健康检查路由
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '2.0.0-refactored',
    });
  });

  // ===== TTS 路由（保留） =====
  app.post('/api/tts', async (req, res) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    try {
      // 动态导入 node-edge-tts
      const { EdgeTTS } = await import('node-edge-tts');
      const tts = new EdgeTTS({
        voice: 'ja-JP-NanamiNeural',
        lang: 'ja-JP',
        pitch: '+10Hz',
        rate: '-10%',
        volume: '+0%',
      });

      // 生成临时文件路径
      const { randomUUID } = await import('crypto');
      const fs = await import('fs');
      const os = await import('os');

      const tempFilePath = path.join(os.tmpdir(), `${randomUUID()}.mp3`);

      // 生成音频
      await tts.ttsPromise(text, tempFilePath);

      // 读取并返回
      const audioBuffer = fs.readFileSync(tempFilePath);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(audioBuffer);

      // 清理临时文件
      fs.unlinkSync(tempFilePath);
    } catch (error) {
      console.error('[TTS] Error:', error);
      res.status(500).json({ error: 'Failed to generate TTS' });
    }
  });

  // ===== Vite 中间件（开发环境） =====
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Init] Setting up Vite middleware for development...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // ===== 静态文件服务（生产环境） =====
    console.log('[Init] Serving static files from dist...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // ===== 错误处理中间件（必须在最后） =====
  app.use(errorHandler);

  // ===== 启动服务器 =====
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════════════════╗
║  Violet AI - Auto Memories Doll Server (v2.0)     ║
║  Refactored with Layered Architecture             ║
╚════════════════════════════════════════════════════╝

Server running at: http://localhost:${PORT}

✓ Routes: /api/chat, /api/tts, /api/health
✓ Services: LLMService, MemoryService, StoryService
✓ Middleware: errorHandler, logger, validation

Environment:
  - NODE_ENV: ${process.env.NODE_ENV || 'development'}
  - ACTIVE_LLM: ${process.env.ACTIVE_LLM || 'deepseek'}
  - Pinecone: ${process.env.PINECONE_API_KEY ? 'enabled' : 'disabled'}
    `);
  });
}

// 启动
startServer().catch(err => {
  console.error('[Init] Failed to start server:', err);
  process.exit(1);
});
