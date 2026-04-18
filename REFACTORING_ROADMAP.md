# Violet AI 项目 - 渐进式迁移路线图（方案 A）

**开始日期**: 2026-04-17  
**目标完成期**: 6-8 周  
**核心目标**: Vanilla TS → React 18 + 分层 Express + 高级向量库

---

## 📋 任务概览（优先级排序）

### 第一阶段：框架搭建与试点（第 1-2 周）
- [ ] **任务 1.1**: 后端目录结构重组（分层模板）
  - 创建 `server/routes/`, `server/services/`, `server/controllers/`, `server/models/`, `server/middleware/`
  - 预计行数：200 行（结构代码）
  - 时间：1 天

- [ ] **任务 1.2**: React 组件框架搭建
  - 创建 `src/components/`, `src/hooks/`, `src/store/`
  - 安装 Zustand、Framer Motion
  - 预计行数：300 行（框架 + 类型定义）
  - 时间：1 天

- [ ] **任务 1.3**: 主菜单 UI React 化（试点迁移）
  - 用 React 重写 `renderMainMenu()`
  - 创建 `MainMenuModal.tsx`, `ConfigModal.tsx` 组件
  - 预计改写：800 行 → 400 行（分到多个组件）
  - 时间：2 天

- [ ] **任务 1.4**: Zustand 状态管理集成
  - 创建 `src/store/gameStore.ts`
  - 将 `StateManager.ts` 逻辑迁移到 Zustand
  - 预计行数：150 行
  - 时间：1 天

### 第二阶段：向量库选型与迁移（第 2-3 周）
- [ ] **任务 2.1**: 向量库评估与选型
  - 对比 Pinecone / Weaviate / Milvus
  - **选型决议**: Pinecone（首选）或 Weaviate（本地）
  - 时间：2 小时

- [ ] **任务 2.2**: Pinecone 集成
  - 注册 Pinecone 免费账户
  - 创建 `server/services/PineconeService.ts`
  - 创建 `server/services/MigrationService.ts`（数据迁移）
  - 预计行数：250 行
  - 时间：2 天

- [ ] **任务 2.3**: VectorDB 迁移脚本
  - 创建 `scripts/migrate-vectors.ts`
  - 从本地 JSON 导出向量，导入 Pinecone
  - 验证向量完整性
  - 预计行数：150 行
  - 时间：1 天

- [ ] **任务 2.4**: 后端 API 改造
  - 替换 `server/VectorDB.ts` 调用为 `PineconeService.ts`
  - 更新 `server.ts` 的 `/api/chat` 路由
  - 测试 RAG 检索流程
  - 预计改写：50 行
  - 时间：1 天

### 第三阶段：核心游戏 UI 迁移（第 3-4 周）
- [ ] **任务 3.1**: 游戏进行中 UI 组件化
  - 创建 `GamePlayUI.tsx`, `DialogueBox.tsx`, `OptionsPanel.tsx`
  - 从 `main.ts` 的 `renderGameUI()` 迁移逻辑
  - 预计改写：1200 行 → 600 行
  - 时间：3 天

- [ ] **任务 3.2**: 存档/读档 UI 组件化
  - 创建 `SaveLoadModal.tsx`
  - 预计改写：400 行 → 200 行
  - 时间：1.5 天

- [ ] **任务 3.3**: 档案库 UI 组件化
  - 创建 `ArchiveLibrary.tsx`, `LetterViewer.tsx`
  - 预计改写：600 行 → 300 行
  - 时间：2 天

### 第四阶段：后端分层完整化（第 4-5 周）
- [ ] **任务 4.1**: 路由层完成
  - `server/routes/chat.ts`
  - `server/routes/tts.ts`
  - `server/routes/health.ts`（新增）
  - 预计行数：150 行
  - 时间：1.5 天

- [ ] **任务 4.2**: 业务逻辑层拆分
  - `server/services/StoryService.ts`（从 StoryManager 迁移）
  - `server/services/LLMService.ts`（LLM 调用通用层）
  - `server/services/MemoryService.ts`（向量检索）
  - `server/services/AudioService.ts`（TTS 封装）
  - 预计行数：400 行
  - 时间：2.5 天

- [ ] **任务 4.3**: 错误处理与中间件
  - `server/middleware/errorHandler.ts`
  - `server/middleware/logger.ts`
  - `server/middleware/validation.ts`
  - 预计行数：200 行
  - 时间：1.5 天

- [ ] **任务 4.4**: 模型与校验层
  - `server/models/types.ts`（共享类型）
  - `server/models/validators.ts`（Zod 校验）
  - 预计行数：150 行
  - 时间：1 天

### 第五阶段：旧代码清理与测试（第 5-6 周）
- [ ] **任务 5.1**: 旧 main.ts 代码拆解
  - 将剩余的 Vanilla TS UI 逻辑分离
  - 标记可删除的代码段
  - 时间：2 天

- [ ] **任务 5.2**: 单元测试编写
  - `__tests__/unit/StoryService.test.ts`
  - `__tests__/unit/LLMService.test.ts`
  - `__tests__/unit/gameStore.test.ts`
  - 预计行数：300 行
  - 时间：2 days

- [ ] **任务 5.3**: 集成测试
  - `__tests__/integration/chat-api.test.ts`
  - 测试 RAG 流程、LLM 调用、状态同步
  - 预计行数：200 行
  - 时间：2 days

### 第六阶段：部署与优化（第 6-8 周）
- [ ] **任务 6.1**: 开发/生产构建验证
  - `npm run build`
  - 测试 dist 目录产物
  - 时间：1 day

- [ ] **任务 6.2**: 性能审查与优化
  - React DevTools Profiler 分析
  - 代码分割（Code Splitting）
  - 预计优化：20-30% 加载时间
  - 时间：1.5 days

- [ ] **任务 6.3**: 云部署准备
  - Dockerfile 更新
  - docker-compose.yml 更新（如有）
  - CI/CD 脚本更新
  - 时间：1.5 days

---

## 📂 新的项目结构

```
violet_ai_project/
├── server/                          ← [新] 后端分层结构
│   ├── index.ts                    (Express 入口，替代原 server.ts)
│   ├── routes/
│   │   ├── chat.ts                 (POST /api/chat)
│   │   ├── tts.ts                  (POST /api/tts)
│   │   └── health.ts               (GET /api/health)
│   ├── services/
│   │   ├── StoryService.ts         (剧情状态机)
│   │   ├── LLMService.ts           (LLM 调用通用层)
│   │   ├── MemoryService.ts        (向量检索，调用 PineconeService)
│   │   ├── PineconeService.ts      (Pinecone 集成，替代 VectorDB.ts)
│   │   ├── AudioService.ts         (TTS 封装)
│   │   └── MigrationService.ts     (数据迁移工具)
│   ├── controllers/                (可选，当前可跳过)
│   ├── models/
│   │   ├── types.ts                (共享类型)
│   │   └── validators.ts           (Zod 校验)
│   └── middleware/
│       ├── errorHandler.ts
│       ├── logger.ts
│       └── validation.ts
│
├── src/
│   ├── main.tsx                    (改为 .tsx，React 入口)
│   ├── components/                 ← [新] React 组件
│   │   ├── MainMenu.tsx
│   │   ├── GameUI.tsx
│   │   ├── DialogueBox.tsx
│   │   ├── OptionsPanel.tsx
│   │   ├── SaveLoadModal.tsx
│   │   ├── ConfigModal.tsx
│   │   ├── ArchiveLibrary.tsx
│   │   ├── LetterViewer.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       └── Card.tsx
│   ├── hooks/                      ← [新] React Hooks
│   │   ├── useGameState.ts
│   │   ├── useAudio.ts
│   │   ├── useLive2D.ts
│   │   └── useVoice.ts
│   ├── store/                      ← [新] Zustand 状态管理
│   │   └── gameStore.ts
│   ├── core/                       (保留，但逐步迁移)
│   │   ├── AudioManager.ts         (可保留为独立模块)
│   │   ├── Live2DManager.ts        (可保留为独立模块)
│   │   └── StateManager.ts         (逐步迁移到 Zustand)
│   ├── types/
│   │   └── game.ts                 (保留，共享类型)
│   ├── index.css
│   └── App.tsx                     ← [新] React 根组件
│
├── scripts/                        ← [新] 脚本
│   └── migrate-vectors.ts          (向量数据迁移脚本)
│
├── __tests__/                      ← [新] 测试
│   ├── unit/
│   │   ├── StoryService.test.ts
│   │   ├── LLMService.test.ts
│   │   └── gameStore.test.ts
│   └── integration/
│       └── chat-api.test.ts
│
├── REFACTORING_ROADMAP.md          ← [新] 此文件
├── MIGRATION_CHECKLIST.md          ← [新] 检查清单
├── .env.local
├── package.json                    (更新依赖)
├── tsconfig.json                   (更新配置)
├── vite.config.ts                  (保留)
└── README.md
```

---

## 🔄 每日检查清单

### 第一周（框架搭建与试点）
- [ ] Day 1: 后端目录结构创建 + 基础模板文件
- [ ] Day 2: React 框架搭建 + Zustand 初始化
- [ ] Day 3: 主菜单 React 化（第一部分）
- [ ] Day 4: 主菜单 React 化（第二部分）+ 样式迁移
- [ ] Day 5: 集成测试 + 修复 bug + 性能调整

### 第二周（向量库集成）
- [ ] Day 6-7: Pinecone 注册 + SDK 集成 + 迁移脚本编写
- [ ] Day 8-9: 向量数据迁移 + 验证
- [ ] Day 10: 后端 API 改造 + 测试

### 第三周（游戏 UI 迁移）
- [ ] Day 11-12: 游戏进行中 UI 组件化
- [ ] Day 13: 存档/读档 UI 组件化
- [ ] Day 14: 档案库 UI 组件化

### 第四周（后端完整化）
- [ ] Day 15-16: 路由层完成 + 业务逻辑拆分
- [ ] Day 17-18: 错误处理与中间件
- [ ] Day 19: 单元测试编写
- [ ] Day 20: 集成测试编写

### 第五周（清理与优化）
- [ ] Day 21-22: 旧代码清理
- [ ] Day 23-25: 性能优化 + 部署验证

---

## 🚀 快速开始（接下来的步骤）

1. **现在**: 创建后端分层目录结构
2. **今天**: 搭建 React 组件框架
3. **明天**: 主菜单 UI 试点迁移
4. **后天**: Pinecone 集成与数据迁移

---

## ⚠️ 关键风险与缓解

| 风险                   | 缓解方案                            | 优先级 |
| ---------------------- | ----------------------------------- | ------ |
| React 迁移期间前端崩溃 | 新旧代码并存 2-4 周，不删除 main.ts | 高     |
| Pinecone 迁移数据丢失  | 迁移前备份所有向量，支持离线导入    | 高     |
| LLM JSON 字段漂移      | Zod 运行时校验 + 降级处理           | 中     |
| 后端 API 不兼容        | 版本控制 (/api/v1/chat) + 兼容层    | 中     |

---

## 📞 相关文档

- [技术栈分析](./REFACTORING_ROADMAP.md)
- [迁移检查清单](./MIGRATION_CHECKLIST.md)（稍后生成）
- [Pinecone 集成指南](./docs/PINECONE_SETUP.md)（稍后生成）

---

**路线图更新时间**: 2026-04-17  
**下一次审查**: 完成第一阶段后（2026-04-24）
