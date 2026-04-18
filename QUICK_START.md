# Violet AI 快速开始指南

**迁移日期**: 2026-04-18  
**当前状态**: 后端已切换到 SQLite 向量库

---

## 1. 安装依赖

```bash
cd /Users/zhenzhang/Documents/Codes/violet_ai_project
npm install
```

依赖中包含：
- `zustand` - 状态管理
- `framer-motion` - 动画库
- 本地 SQLite 运行时支持 - 向量库

---

## 2. 启动后端

```bash
npm run dev
```

启动后可看到：

```text
Server running at: http://localhost:3000
✓ Routes: /api/chat, /api/tts, /api/health
✓ Services: LLMService, MemoryService, StoryService
```

---

## 3. 配置环境变量

编辑 `.env.local`：

```bash
GEMINI_API_KEY=your_gemini_key
DEEPSEEK_API_KEY=your_deepseek_key
OPENAI_API_KEY=your_openai_key

# 本地向量库
VECTOR_DB_PATH=.data/memory.sqlite

ACTIVE_LLM=deepseek
```

`.env.local` 已在 `.gitignore` 中，不会上传到 Git。

---

## 4. 当前进度

| 模块       | 状态     | 完成度 |
| ---------- | -------- | ------ |
| 后端分层   | ✅ 完成   | 100%   |
| React 框架 | ✅ 完成   | 95%    |
| 主菜单 UI  | ✅ 完成   | 90%    |
| 向量库集成 | ✅ SQLite | 100%   |
| 依赖安装   | ⏳ 待用户 | 0%     |

---

## 5. 验证清单

- [ ] `npm install` 成功完成
- [ ] `npm run dev` 成功启动后端
- [ ] `.env.local` 已配置本地向量库路径（可选）
- [ ] 前端页面在 http://localhost:5173 可正常加载
- [ ] 看到 Violet AI 主菜单 UI

---

## 6. 文件概览

```text
violet_ai_project/
├── server/
│   ├── index.ts
│   ├── routes/
│   ├── services/
│   │   ├── LLMService.ts
│   │   ├── MemoryService.ts
│   │   ├── StoryService.ts
│   │   └── AudioService.ts
│   ├── models/
│   └── middleware/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   ├── hooks/
│   └── store/
├── scripts/
│   └── migrate-vectors.ts
├── REFACTORING_ROADMAP.md
└── MIGRATION_CHECKLIST.md
```

---

## 7. 下一步

1. 创建后端分层目录结构
2. 搭建 React 组件框架
3. 继续完善 UI 组件
4. 运行测试并检查构建

---

## 8. 常见问题

**Q: 记忆数据存在哪里？**  
A: 存在本地 `.data/memory.sqlite` 中。

**Q: 旧 JSON 记忆怎么处理？**  
A: 运行 `npm run migrate:vectors`，脚本会把旧 JSON 数据导入 SQLite。

**Q: 记忆检索现在用什么？**  
A: 当前主线使用本地 SQLite。

---

准备好了吗？运行 `npm run dev`。
