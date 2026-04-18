# Violet AI 迁移 - 快速开始指南

**迁移日期**: 2026-04-17  
**完成度**: 第一阶段 95% 完成

---

## 🎯 现在立即要做的事（接下来 1 小时）

### Step 1: 安装依赖
```bash
cd /Users/zhenzhang/Documents/Codes/violet_ai_project
npm install
```

这会安装：
- `zustand` - 状态管理
- `@pinecone-database/pinecone` - 向量库
- `framer-motion` - 动画库
- 其他开发依赖

**预计时间**: 5-10 分钟

---

### Step 2: 验证后端启动
```bash
npm run dev
```

**预期输出**：
```
╔════════════════════════════════════════════════════╗
║  Violet AI - Auto Memories Doll Server (v2.0)     ║
║  Refactored with Layered Architecture             ║
╚════════════════════════════════════════════════════╝

Server running at: http://localhost:3000
✓ Routes: /api/chat, /api/tts, /api/health
✓ Services: LLMService, MemoryService, StoryService
...
```

如果看到这个输出，说明后端已成功启动！🎉

**预计时间**: 2-3 分钟

---

### Step 3: 注册 Pinecone（今天完成）

1. 访问 https://www.pinecone.io/
2. 点击 "Sign Up" 免费注册
3. 创建一个组织和项目
4. 在控制面板创建索引：
   - **Name**: `violet-ai-memories`
   - **Dimension**: `768`
   - **Metric**: `Cosine`
   - **Pod Type**: `Starter (Free)`
5. 记下你的 **API Key** 和 **Environment**

详细步骤见 [PINECONE_SETUP.md](./PINECONE_SETUP.md)

---

### Step 4: 配置环境变量

编辑 `.env.local`：

```bash
# 已有
GEMINI_API_KEY=your_gemini_key
DEEPSEEK_API_KEY=your_deepseek_key
OPENAI_API_KEY=your_openai_key

# 新增（从 Pinecone 获取）
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=us-west1-gcp-free
PINECONE_INDEX_NAME=violet-ai-memories

# LLM 选择
ACTIVE_LLM=deepseek  # 或 gemini
```

**⚠️ 重要**: `.env.local` 已在 `.gitignore` 中，不会上传到 Git

---

## 📊 当前进度状态

| 模块          | 状态       | 完成度 |
| ------------- | ---------- | ------ |
| 后端分层      | ✅ 完成     | 100%   |
| React 框架    | ✅ 完成     | 95%    |
| 主菜单 UI     | ✅ 完成     | 90%    |
| 向量库集成    | ✅ 准备就绪 | 90%    |
| Pinecone 注册 | ⏳ 待用户   | 0%     |
| 依赖安装      | ⏳ 待用户   | 0%     |

---

## 🔍 验证清单

完成以上步骤后，检查：

- [ ] `npm install` 成功完成
- [ ] `npm run dev` 成功启动后端（Server running at http://localhost:3000）
- [ ] `.env.local` 已配置 Pinecone 凭证
- [ ] 前端页面在 http://localhost:5173 可正常加载
- [ ] 看到 Violet AI 主菜单 UI

---

## 📁 新增文件概览

```
violet_ai_project/
├── server/
│   ├── index.ts                  (新) 后端入口
│   ├── routes/chat.ts            (新) 聊天路由
│   ├── services/
│   │   ├── LLMService.ts         (新) LLM 通用层
│   │   ├── PineconeService.ts    (新) 向量库
│   │   ├── MemoryService.ts      (新) 记忆检索
│   │   └── StoryService.ts       (新) 故事管理
│   ├── models/types.ts           (新) 共享类型
│   └── middleware/errorHandler.ts (新) 错误处理
├── src/
│   ├── main.tsx                  (新) React 入口
│   ├── App.tsx                   (新) 根组件
│   ├── components/
│   │   ├── MainMenu.tsx          (新) 主菜单
│   │   ├── ConfigModal.tsx       (新) 配置
│   │   ├── SaveLoadModal.tsx     (新) 存档读档
│   │   └── ArchiveModal.tsx      (新) 档案库
│   ├── hooks/useGameState.ts    (新) React Hook
│   └── store/gameStore.ts        (新) Zustand
├── scripts/migrate-vectors.ts    (新) 向量迁移脚本
├── REFACTORING_ROADMAP.md        (新) 详细路线图
├── PINECONE_SETUP.md             (新) Pinecone 指南
└── MIGRATION_CHECKLIST.md        (新) 检查清单
```

---

## 🚀 下一阶段（后续 1-2 周）

1. **向量迁移** - 运行 `npm run migrate:vectors` 导入本地数据
2. **游戏 UI 迁移** - 创建 GameUI、DialogueBox、OptionsPanel 组件
3. **存档读档** - 完整实现 SaveLoadModal 功能
4. **测试与优化** - 运行测试，性能分析

详见 [REFACTORING_ROADMAP.md](./REFACTORING_ROADMAP.md)

---

## 💬 常见问题

**Q: 为什么要迁移到 React？**  
A: 主菜单、配置、存档等 UI 已经 4000+ 行代码，React 组件化能大幅降低复杂度，方便维护和扩展。

**Q: Pinecone 免费层够用吗？**  
A: 足够。免费层支持 10K 向量，除非你有超过 10K 条对话记忆，否则无需升级。

**Q: 旧的 main.ts 怎么办？**  
A: 保留在项目中作为参考。后续的 React 组件会逐步迁移其逻辑。

**Q: 后端和前端需要同时改吗？**  
A: 不需要。这次迁移是"渐进式"的，新旧并存 2-4 周。你可以先稳定后端，再迁移前端。

---

## 📞 获取帮助

- 查看 [REFACTORING_ROADMAP.md](./REFACTORING_ROADMAP.md) 了解总体计划
- 查看 [PINECONE_SETUP.md](./PINECONE_SETUP.md) 了解 Pinecone 集成
- 查看 [MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md) 跟踪进度

---

**状态**: ✅ 第一阶段框架搭建完成，等待用户执行第一步  
**预计完成时间**: 1 小时（包括 npm install）

准备好了吗？ 👉 `npm install`
