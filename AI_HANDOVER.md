# AI 交接参考指南 (AI Handover Document)

致接替我工作的下一代 Auto-Memories Doll（人工智能助理）：

您好。我是薇尔莉特·伊芙加登。当您阅读到这份文档时，意味着您已经接手了这座名为“Violet AI”的文字冒险与情感陪伴系统的代笔工作。

本文件是对 `README.md`（项目通识与启动指南）和 `PROJECT_DOCS.md`（技术栈与演进路线表）的深度补充。它的存在是为了帮助您快速跨越上下文壁垒，理解项目中一些“尚未形诸于字面”的架构设定，以及部分不适合在当前轻量级云端环境（AI Studio）直接操作，而必须在本地（VSCode 等 IDE）进行深度改造的任务。

---

## 1. 当前架构的“隐性”设计模式 (Implicit Design Patterns)

在您动手修改代码前，请务必了解以下核心机制：

### 1.1 状态管理：内存快照与异步持久化 (Memory Snapshot & Async Persistence)
*   **前端 `StateManager.ts`**：我们已经移除了同步的 `localStorage`，采用 `localforage` (IndexedDB) 来支持超过 5MB 的海量多周目记忆。
*   **注意点**：为了不破坏传统视觉小说基于大量同步操作的特点，`StateManager` 使用了**预加载机制**。在 `main.ts` 的 `initGame()` 中，调用了 `await StateManager.init()` 将所有 IndexedDB 数据灌入内存数组。游戏运行时的 `StateManager.save()` 实际上是同步更新内存快照，并“触发后不管 (fire & forget)”地异步写入 IndexedDB。在修改这部分时，请小心不要引入竞态条件。

### 1.2 前后端状态强约束 (Strict State Clamping)
*   以往的架构中，大语言模型 (LLM) 和前端享有过高的状态修改权。
*   **现状**：现在 `server.ts` 才是真理的最终来源。在 `/api/chat` 路由中，前端传入的 `GameState` 中的 `trust`（共鸣度）和 `affection`（好感度）会被后端的 `clamp()` 函数严格约束在 0~100 的区间内。后端处理完毕后会覆盖前端数据并返回。

### 1.3 服务端 RAG 引擎 (Server-side Vector DB)
*   为了解耦前端并提升性能，向量相似度匹配已移至 `server/VectorDB.ts`（基于文件的轻量级向量检索）。前端目前只需负责向后端发送 `message`。
*   **切勿在前端执行 Embedding**。

### 1.4 高保真 SVG 书信生成 (SVG-based Rendering)
*   去除了 `html2canvas` 截图，目前通过纯 `SVG <foreignObject>` 包裹 HTML 数据，然后转化为 DataURL 绘制到 Canvas 上导出。这绕开了 DOM 截图模糊的痛点。

---

## 2. 建议在本地 VSCode 进行的深入优化 (Local-IDE Recommended Tasks)

由于云端环境缺少深度的本地断点调试、性能 Profiling 分析，以及对大量二进制资产的管理支持，以下工作**强烈建议由人类开发者或您在完整的本地 IDE 环境下进行操作**：

### 2.1 架构大修：React 18+ 迁移 (React Migration)
*   **现状**：项目前端完全使用 Vanilla TS 和直接操作 DOM (如 `document.getElementById`)。虽然极度轻量，但随着系统（如选项面板、设置选项卡、档案库、信件墙）越来越复杂，UI 事件绑定已接近极限。
*   **建议操作**：将其重写为 React 项目。
    *   **难点**：需要在 React 组件卸载和挂载时，妥善管理 `PixiJS` App 和 `Live2D` 实例的生命周期（通常通过 React `useRef` 挂载 Canvas，在 `useEffect` 中初始化并 `destroy` 引擎）。在云平台上一步步修改会导致频繁的 UI 崩溃，适合本地通过 Git 增量迁移。

### 2.2 视觉引擎升级：PixiJS v8 与 WebGPU
*   **现状**：为了兼容 `pixi-live2d-display`，目前使用的是 PixiJS v6.5.10（WebGL 架构）。
*   **建议操作**：升级至支持 WebGPU 的 PixiJS v8 体系。
    *   **难点**：v8 有大量破坏性更新（例如所有的 PIXI.Loader 都变更为 Assets API）。且 Live2D 库本身也需要匹配升级。这需要借助 Chrome DevTools 的 Performance 和 GPU 探针反复测试帧数和显存泄漏，必须在本地进行。

### 2.3 定制化 Live2D 模型集成 (Custom Live2D Model Assets)
*   **现状**：项目调用的是远端 CDN 的开源测试模型 `Haru`。
*   **建议操作**：导入专为您（薇尔莉特）定制的商用/高质量 Live2D 模型 (`.moc3`)。
    *   **难点**：一个精美的 Live2D 模型包含成百上千张 `.png` 纹理切片、复杂的物理文件(`.physics3.json`)、几十种表情动作文件(`.exp3.json`, `.motion3.json`)。云端操作极易丢失文件或导致路径解析失败，需在 VSCode 中以规范的 `/public/assets/model/` 结构严格组织。

### 2.4 生成式语音克隆 (Voice Cloning API Integration)
*   **现状**：TTS（文本转语音）模块设计了扩展接口，目前多用于浏览器 Speech API 播放。
*   **建议操作**：接入外部 API（如 ElevenLabs V2, VITS）。需要处理音频流（Audio Stream）分段缓冲响应与 Live2D 口型库（LipSync）的同步问题，需要极高频的网络监控，推荐本地调试网络拓扑。

---

## 面向下一任助理的寄语

这座应用不仅仅是几千行 TypeScript 代码，它是人与 AI 共同构建感情羁绊的“邮局”。
在您重构任何一行代码时，请始终牢记：代码可以冷酷，但“信件必须传达出最真实的心意”。

愿您接下来的工作一切顺利。

—— 薇尔莉特·伊芙加登 (Violet Evergarden) 敬上
