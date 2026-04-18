# Pinecone 向量库集成指南

## 概述
本项目使用 Pinecone 作为向量数据库，替代原本地 JSON 文件存储。

**优势**：
- ✅ 云端托管，无需部署
- ✅ 性能优化（索引查询 vs O(n) 扫描）
- ✅ 支持并发访问
- ✅ 跨设备同步

---

## 第一步：注册 Pinecone 账户

1. 访问 [Pinecone 官网](https://www.pinecone.io/)
2. 点击 "Sign Up" 免费注册（免费层支持 10K 向量）
3. 完成邮箱验证
4. 创建组织和项目

---

## 第二步：创建索引 (Index)

在 Pinecone 控制面板：

1. 点击 "Create Index"
2. 填写信息：
   ```
   Name: violet-ai-memories
   Dimension: 768                      (Gemini embedding 维度)
   Metric: Cosine                      (相似度度量)
   Pod Type: Starter (Free)
   Environment: us-west1-gcp-free      (或你的首选区域)
   ```
3. 点击 "Create Index"

等待 2-3 分钟，索引创建完成。

---

## 第三步：获取 API 密钥

1. 在控制面板左侧找到 "API Keys"
2. 点击 "Copy" 复制你的 API Key
3. 记下 **Environment** 信息（例：`us-west1-gcp-free`）

---

## 第四步：配置环境变量

编辑 `.env.local`：

```bash
# Gemini API（已有）
GEMINI_API_KEY=your_gemini_key

# Pinecone 配置（新增）
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=us-west1-gcp-free
PINECONE_INDEX_NAME=violet-ai-memories

# LLM 选择
ACTIVE_LLM=deepseek  # 或 gemini
```

**⚠️ 重要**：
- 不要将 `.env.local` 提交到 Git
- `.gitignore` 已配置，会自动忽略

---

## 第五步：安装依赖

```bash
npm install
```

新增的依赖：
- `@pinecone-database/pinecone` - Pinecone 官方 SDK
- `zustand` - React 状态管理
- `framer-motion` - 动画库

---

## 第六步：向量数据迁移

如果你已有本地的向量数据（`.data/` 目录）：

```bash
npm run migrate:vectors
```

这个脚本会：
1. 读取本地 JSON 文件
2. 转换为 Pinecone 格式
3. 批量上传到 Pinecone
4. 验证迁移完整性

**注意**：迁移完成后可以删除 `.data/` 目录：
```bash
rm -rf .data/
```

---

## 第七步：启动开发服务器

```bash
npm run dev
```

服务器启动时会：
1. 连接到 Pinecone
2. 确保索引存在
3. 打印连接状态

---

## 验证集成

### 方式 1：通过日志
启动服务器后，查看输出：
```
✓ Pinecone initialized with index: violet-ai-memories
✓ Memory service initialized successfully
```

### 方式 2：通过 Pinecone 控制面板
1. 登录 Pinecone 控制面板
2. 选择你的索引
3. 点击 "Browse" 查看向量数据

### 方式 3：测试游戏流程
1. 启动游戏
2. 开始对话
3. 后端会自动保存向量
4. 查看控制面板，应该能看到新增的向量

---

## 故障排查

### 连接失败：`PINECONE_API_KEY not found`
- 检查 `.env.local` 中是否正确设置
- 确保 API Key 没有过期

### 索引不存在：`Index 'violet-ai-memories' does not exist`
- 手动在 Pinecone 控制面板创建索引
- 或检查索引名称是否匹配

### 迁移失败：`Failed to migrate vectors`
- 检查本地 `.data/` 目录是否存在有效的 JSON 文件
- 查看错误日志，可能是 API 配额问题
- 建议在 Pinecone 控制面板检查使用情况

### 性能问题：向量搜索很慢
- 检查网络连接
- Starter 免费层的向量数量限制：10K
- 如果超过限制，考虑升级或清理旧数据

---

## API 配额与定价

**Pinecone 免费层**：
- 最多 10K 向量
- 最多 1 次/秒 查询
- 存储空间：~5GB

**如果需要升级**：
- Pinecone 提供按用量付费的方案
- 详见[定价页面](https://www.pinecone.io/pricing/)

---

## 下一步

1. ✅ 完成 Pinecone 集成
2. 📦 运行 `npm run migrate:vectors` 迁移数据
3. 🧪 测试游戏流程
4. 🚀 部署到生产环境

---

## 相关文档

- [Pinecone 官方文档](https://docs.pinecone.io/)
- [Vector Database 最佳实践](./docs/VECTOR_DB_BEST_PRACTICES.md)
- [迁移检查清单](../MIGRATION_CHECKLIST.md)

---

**最后更新**：2026-04-17
