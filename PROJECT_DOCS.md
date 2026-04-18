# Violet AI - 视觉小说 (Visual Novel) 项目文档

## 项目概述
本项目是一个基于 Web 的轻量级视觉小说/文字冒险游戏框架。玩家在游戏中与扮演《紫罗兰永恒花园》主角“薇尔莉特·伊芙加登”的 AI 进行互动。项目结合了现代前端 UI 设计（毛玻璃效果、打字机动画、平滑转场）、Live2D 动态立绘、RAG 记忆系统以及强大的后端大语言模型（支持 Gemini），提供沉浸式的情感陪伴体验。

**当前状态：核心开发已完成 (MVP Completed)**。游戏具备了完整的生命周期（开始、多分支剧情、多结局、继承周目），系统稳定且功能丰富。

## 技术栈与优化建议
### 当前架构 (Current MVP)
- **前端**: Vanilla TypeScript, HTML5, CSS3
- **样式**: Tailwind CSS (通过 Vite 插件集成)
- **动画与视觉**: PixiJS (v6.5.10), pixi-live2d-display (用于 Live2D 模型渲染), html2canvas (用于信件导出)
- **后端**: Node.js, Express
- **构建工具**: Vite
- **AI 集成**: `@google/genai` (用于调用 Google Gemini 接口生成对话与 Embedding 向量)
- **数据库**: Client-side Vector Database (基于 `localStorage` 和余弦相似度的轻量级 RAG 实现)

### 建议优化选型 (Optimized Roadmap)
为了提升应用在复杂交互下的可维护性及承载更海量的记忆，建议进行以下迭代：
- **UI 管理**: 步入 **React 18+** 架构。利用声明式组件管理复杂的对话状态与 UI 面板。
- **存储方案**: 从 `localStorage` 迁移至 **IndexedDB** (推荐使用 `localForage`)，以支持超过 5MB 的海量“跨周目记忆”。
- **RAG 架构**: 采用 **Server-side Hybrid RAG**。将向量匹配逻辑移至后端 Express，提升计算性能并保护 Embedding 逻辑。
- **视觉引擎**: 升级至 **PixiJS v8** (WebGPU 驱动)，并采用基于 **SVG** 的高质量书信渲染方案，替代 `html2canvas` 以获得更高的视觉保真度。

## 目录结构与核心文件说明
- `/index.html`: 项目的入口 HTML 文件。
- `/src/main.ts`: 前端核心逻辑。负责动态生成 UI、绑定事件监听器、处理与后端的 API 通信、管理 Live2D 渲染、处理转场动画以及管理多语言切换。
- `/src/index.css`: 全局样式文件。引入了 Tailwind CSS。
- `/server.ts`: 后端核心逻辑。使用 Express 搭建服务器，集成了 Vite 中间件。包含核心的 `/api/chat` 路由（对话状态机）和 `/api/embed` 路由（生成文本向量）。
- `/src/core/StateManager.ts`: 负责本地存储（存档/读档）、信件库（Archive）、信任度（Trust）与好感度（Affection）的数据管理。
- `/src/core/VectorMemory.ts`: 客户端向量数据库管理器，负责存储、检索玩家的对话历史，实现 RAG 记忆。
- `/src/core/Live2DManager.ts`: 封装 PixiJS 和 Live2D 模型的加载、渲染与表情/动作映射逻辑。
- `/server/StoryManager.ts`: 核心剧本与人设管理器。控制对话的 6 个阶段，根据好感度/信任度以及 RAG 检索到的历史记忆动态生成 Prompt。
- `/src/core/AudioManager.ts`: 管理 BGM、环境音效（打字机/白噪音）以及基于 Web Speech API 的 TTS 语音。

## 核心逻辑解析

### 1. 动态剧情状态机 (Dynamic Story State Machine)
对话流程由 `StoryManager.ts` 控制，分为 6 个阶段：
- **GREETING (问候)**: 开场白，根据是否是二周目（NG+）有不同的反应。
- **INQUIRY (询问)**: 倾听玩家烦恼。
- **DEEPENING (深入)**: 核心循环。AI 根据当前的**信任度 (Trust)**和**好感度 (Affection)**动态调整回复的深度。如果两者都很高，AI 会主动分享自己的脆弱回忆。
- **DRAFTING (起草)**: 确认信件风格。
- **DELIVERY (交付)**: 生成最终信件，并根据好感度触发不同的结局（True, Good, Normal, Bad）。
- **REFUSAL (拒绝)**: 触发安全机制时的提前结束。

### 2. 情感与关系系统 (Relationship System)
- **好感度 (Affection)**: 影响结局走向和 AI 的语气温和度。UI 右上角有进度条显示。
- **信任度 (Trust)**: 影响对话深度的解锁。高信任度会解锁更私人的对话选项和 AI 的主动分享。

### 3. RAG 记忆系统 (Retrieval-Augmented Generation)
- **向量化存储**: 玩家的每一轮对话都会通过 Gemini API (`gemini-embedding-2-preview`) 转化为向量，并存储在本地的 `VectorMemoryManager` 中。
- **灵魂共鸣**: 在多周目游玩时，系统会检索与当前对话最相关的历史记忆，并注入到 AI 的 Prompt 中，使薇尔莉特能够回忆起玩家很久以前说过的原话。

### 4. 视觉与表现系统
- **Live2D 动态立绘**: 引入了 `pixi-live2d-display`。AI 每次回复附带的情绪标签 (`smile`, `sad`, `surprised` 等) 会被实时映射为 Live2D 模型的表情 (Expression) 和动作 (Motion)，极大提升了沉浸感。
- **信件导出**: 玩家可以在游戏结束或 Archive 界面中，将专属信件导出为带有复古信纸背景和火漆印章的高清图片，方便社交分享。

## 开发进度记录

### 已完成功能 (Done)
- [x] 基础的前后端项目结构搭建 (Vite + Express)。
- [x] 视觉小说风格的 UI 设计 (背景图、毛玻璃对话框)。
- [x] 沉浸式交互体验 (打字机文字显示效果、打字机音效、视差滚动)。
- [x] **多语言系统**: 支持中、日、英三语实时切换。
- [x] **好感度与信任度系统**: 动态影响剧情分支、选项生成和最终结局。
- [x] **多结局系统**: 包含 True Ending (仅限二周目), Good, Normal, Bad 以及提前拒绝结局。
- [x] **New Game+ (二周目继承)**: 通关 Good Ending 后解锁。
- [x] **本地存档系统**: 6 个独立存档槽位 + 快速存档/读档 (Q.SAVE/Q.LOAD)。
- [x] **信件收藏库 (Archive)**: 通关后生成的信件自动永久保存并可随时回顾。
- [x] **AI 语音系统 (TTS)**: 自动匹配高质量日文女声朗读 AI 的日文回复。
- [x] **长记忆系统 (RAG)**: 引入轻量级客户端向量数据库，实现跨周目的具体对话细节回忆。
- [x] **Live2D 动态立绘**: 替换静态图片，实现基于情绪标签的动态表情与动作响应。
- [x] **信件导出功能**: 使用 `html2canvas` 允许玩家将信件导出为精美图片。

### 暂不考虑的功能 (Deferred/Not Planned)
- **账号登录与云端同步**: 经过评估，为了保持游戏“零门槛、即开即玩”的沉浸式体验，并保护玩家倾诉烦恼时的隐私安全感，**目前决定不引入强制或可选的账号登录系统**。所有数据（存档、信件、RAG 记忆）均保存在玩家本地浏览器中。

### 后续开发建议 (Future Roadmap)
虽然核心框架已开发完毕，但仍可通过以下方向提升品质：
1. **定制化 Live2D 模型**: 目前使用的是开源测试模型（Haru），后续可替换为专门定制的“薇尔莉特” Live2D 模型，并重新映射更细腻的专属表情与动作。
2. **高级语音合成 (Voice Cloning)**: 接入 ElevenLabs 或 VITS 等高级 AI 语音 API，克隆原版声优的音色，替代目前的 Edge TTS。
3. **架构大修 (React Migration)**: 将项目重构为 React 架构，以更好地支撑后续复杂的功能扩展。
4. **高质量书信导出**: 开发基于 SVG 的高保真书信渲染器。
5. **记忆持久化升级**: 实现 IndexedDB 存储，打破浏览器本地存储的容量限制。

---
*文档更新时间: 2026-04-17*
