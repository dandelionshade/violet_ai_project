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
import { requestLogger } from './middleware/logger';
import { MemoryService } from './services/MemoryService';
import chatRoutes from './routes/chat';
import ttsRoutes from './routes/tts';
import healthRoutes from './routes/health';

// 加载环境变量
dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // ===== 中间件配置 =====
  app.use(express.json());
  app.use(requestLogger);

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
  app.use('/api', ttsRoutes);
  app.use('/api', healthRoutes);

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
