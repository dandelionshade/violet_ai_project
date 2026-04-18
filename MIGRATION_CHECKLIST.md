# Violet AI 迁移检查清单 (Migration Checklist)

**项目**：Violet AI - 渐进式迁移到 React + 分层 Express + Pinecone  
**开始日期**：2026-04-17  
**状态**：🔄 进行中

---

## ✅ 第一阶段：框架搭建（第 1-2 周）

### 后端分层
- [x] 创建 `server/routes/`、`server/services/`、`server/models/`、`server/middleware/`
- [x] 创建 `server/models/types.ts` - 共享类型定义
- [x] 创建 `server/middleware/errorHandler.ts` - 错误处理中间件
- [x] 创建 `server/services/LLMService.ts` - LLM 通用层
- [x] 创建 `server/services/PineconeService.ts` - 向量库集成
- [x] 创建 `server/services/MemoryService.ts` - 记忆检索层
- [x] 创建 `server/services/StoryService.ts` - 故事管理层
- [x] 创建 `server/routes/chat.ts` - 聊天路由
- [x] 创建 `server/index.ts` - 新入口文件
- [ ] 更新 `server.ts` 改为调用 `server/index.ts`（或直接删除）
- [ ] 测试后端启动是否正常

### React 框架搭建
- [x] 创建 `src/components/`、`src/hooks/`、`src/store/` 目录
- [x] 创建 `src/store/gameStore.ts` - Zustand 状态管理
- [x] 创建 `src/hooks/useGameState.ts` - React Hook
- [x] 创建 `src/components/MainMenu.tsx` - 主菜单组件
- [x] 创建 `src/components/ConfigModal.tsx` - 配置组件
- [x] 创建 `src/components/SaveLoadModal.tsx` - 存档读档组件（占位）
- [x] 创建 `src/components/ArchiveModal.tsx` - 档案库组件（占位）
- [ ] 创建 `src/App.tsx` - React 根组件
- [ ] 更新 `src/main.tsx` 改为 React entry point
- [ ] 测试 React 组件是否能正常加载

### 依赖管理
- [x] 更新 `package.json` - 添加 Zustand、Pinecone、Framer Motion
- [x] 更新 `package.json` - 添加脚本 `npm run migrate:vectors`
- [ ] 运行 `npm install` 安装新依赖

### 文档与脚本
- [x] 创建 `REFACTORING_ROADMAP.md` - 详细路线图
- [x] 创建 `PINECONE_SETUP.md` - Pinecone 集成指南
- [x] 创建 `scripts/migrate-vectors.ts` - 向量迁移脚本
- [x] 创建 `MIGRATION_CHECKLIST.md` - 此文档

---

## 🔄 第二阶段：向量库集成（第 2-3 周）

### Pinecone 注册与配置
- [ ] 注册 Pinecone 免费账户
- [ ] 在 Pinecone 创建索引 `violet-ai-memories`
- [ ] 获取 API Key 和 Environment
- [ ] 配置 `.env.local` 文件
  ```
  PINECONE_API_KEY=...
  PINECONE_ENVIRONMENT=us-west1-gcp-free
  PINECONE_INDEX_NAME=violet-ai-memories
  ```

### 向量迁移
- [ ] 运行 `npm run migrate:vectors` 脚本
- [ ] 验证迁移日志输出
- [ ] 在 Pinecone 控制面板检查向量是否正确导入
- [ ] 备份 `.data/` 目录（可选）
- [ ] 删除本地 `.data/` 目录

### 后端 API 改造
- [x] 已在 `server/services/MemoryService.ts` 完成
- [ ] 在实际游戏中测试 RAG 流程
- [ ] 验证向量检索是否正确工作

---

## 🎮 第三阶段：核心游戏 UI 迁移（第 3-4 周）

### 前端入口重构
- [ ] 创建 `src/App.tsx` - React 根组件
- [ ] 更新 `src/main.tsx` 改为 `.tsx` 并引入 React
- [ ] 在 `App.tsx` 中集成 MainMenu、GameUI 等组件

### 游戏进行中 UI
- [ ] 创建 `src/components/GameUI.tsx`
- [ ] 创建 `src/components/DialogueBox.tsx`
- [ ] 创建 `src/components/OptionsPanel.tsx`
- [ ] 从 `main.ts` 迁移 `renderGameUI()` 逻辑
- [ ] 测试游戏进行中的 UI 是否正常渲染

### 存档读档 UI
- [ ] 完整实现 `SaveLoadModal.tsx`
- [ ] 集成 Zustand 状态管理
- [ ] 测试存档/读档功能

### 档案库 UI
- [ ] 完整实现 `ArchiveModal.tsx`
- [ ] 创建 `src/components/LetterViewer.tsx`
- [ ] 测试信件查阅和导出功能

---

## 🏗 第四阶段：后端分层完整化（第 4-5 周）

### 路由完成
- [x] 已创建 `server/routes/chat.ts`
- [ ] 创建 `server/routes/tts.ts` - TTS 路由
- [ ] 创建 `server/routes/health.ts` - 健康检查路由

### 业务逻辑拆分
- [x] 已创建 StoryService、LLMService、MemoryService
- [ ] 创建 `server/services/AudioService.ts` - TTS 服务
- [ ] 移除 `server.ts` 的内联 TTS 逻辑

### 中间件完善
- [x] 已创建错误处理中间件
- [ ] 创建 `server/middleware/logger.ts` - 日志中间件
- [ ] 创建 `server/middleware/validation.ts` - 请求校验

### 模型与校验
- [x] 已创建 `server/models/types.ts`
- [ ] 创建 `server/models/validators.ts` - Zod 校验规则
- [ ] 应用验证规则到路由

---

## 🧪 第五阶段：测试与清理（第 5-6 周）

### 单元测试
- [ ] 创建 `__tests__/unit/StoryService.test.ts`
- [ ] 创建 `__tests__/unit/LLMService.test.ts`
- [ ] 创建 `__tests__/unit/gameStore.test.ts`
- [ ] 运行 `npm test` 验证

### 集成测试
- [ ] 创建 `__tests__/integration/chat-api.test.ts`
- [ ] 测试完整的 /api/chat 流程
- [ ] 测试 RAG 记忆检索
- [ ] 测试错误处理

### 旧代码清理
- [ ] 标记 `main.ts` 中可删除的代码
- [ ] 逐步删除已迁移到 React 的代码
- [ ] 删除原始 `server.ts`（替代为 `server/index.ts`）

### 性能优化
- [ ] 运行 `npm run build` 构建
- [ ] 检查 dist 产物大小
- [ ] 用 Chrome DevTools Profiler 分析性能
- [ ] 实施代码分割（Code Splitting）

---

## 🚀 第六阶段：部署与发布（第 6-8 周）

### 开发/生产构建
- [ ] 验证 `npm run dev` 启动正常
- [ ] 验证 `npm run build` 构建成功
- [ ] 验证 `npm run preview` 预览生产构建
- [ ] 检查网络请求是否正确路由

### 云部署准备
- [ ] 更新 `Dockerfile`（如有）
- [ ] 更新 `.dockerignore`
- [ ] 更新 `docker-compose.yml`（如有）
- [ ] 配置 GitHub Actions CI/CD（可选）

### 上线前检查
- [ ] 运行 `npm run lint` 检查代码规范
- [ ] 确认所有环境变量已配置
- [ ] 备份生产数据（Pinecone）
- [ ] 制定回滚方案

---

## 📊 进度统计

| 阶段       | 完成度 | 优先级 | 状态     |
| ---------- | ------ | ------ | -------- |
| 框架搭建   | 90%    | 🔴      | ⏳ 进行中 |
| 向量库集成 | 50%    | 🔴      | ⏳ 进行中 |
| UI 迁移    | 20%    | 🟠      | ⏳ 待开始 |
| 后端完整化 | 40%    | 🟠      | ⏳ 待开始 |
| 测试与清理 | 0%     | 🟡      | ⏳ 待开始 |
| 部署与发布 | 0%     | 🟡      | ⏳ 待开始 |

**整体完成度**: 30%

---

## 🎯 关键里程碑

1. **第 2 天**：框架搭建完成，后端能正常启动 ✅
2. **第 7 天**：Pinecone 集成完成，向量迁移成功 📅
3. **第 14 天**：主菜单 React 化完成，能正常渲染 📅
4. **第 21 天**：核心 UI 迁移完成，游戏能正常进行 📅
5. **第 30 天**：全量测试完成，准备部署 📅

---

## ⚠️ 风险与缓解

| 风险                   | 影响 | 缓解方案                 | 优先级 |
| ---------------------- | ---- | ------------------------ | ------ |
| React 迁移期间前端崩溃 | 高   | 新旧并存 2-4 周          | 🔴      |
| Pinecone 迁移数据丢失  | 高   | 迁移前备份，支持离线导入 | 🔴      |
| LLM JSON 字段漂移      | 中   | Zod 运行时校验 + 降级    | 🟠      |
| 后端 API 不兼容        | 中   | 版本控制 + 兼容层        | 🟠      |

---

## 📝 日志

### 2026-04-17
- ✅ 创建路线图文档
- ✅ 建立后端分层目录结构
- ✅ 创建 LLMService、PineconeService、MemoryService
- ✅ 创建新的后端入口 `server/index.ts`
- ✅ 搭建 React 组件框架与 Zustand 状态管理
- ✅ 试点迁移主菜单 UI 到 React
- ✅ 创建 Pinecone 集成指南

### 待记录...

---

**维护者**：Violet AI 开发团队  
**最后更新**：2026-04-17
