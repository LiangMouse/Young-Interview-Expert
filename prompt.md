# Young-Interview-Expert 项目总览

## 项目背景与目标

**Young-Interview-Expert** 是一个专为中文互联网技术岗求职者打造的 AI 面试官智能体应用。项目目标是创建一个让用户愿意多次使用的舒适、专业且高效的面试体验平台，助力在校招和社招中取得成功。

## 核心功能特点

### 已实现功能 ✅

- **用户认证系统**：基于 Supabase 的登录/注册功能
- **简历处理**：PDF 解析、结构化数据提取、RAG 向量存储
- **AI 对话系统**：基于 DeepSeek V3 的流式聊天，支持 AI SDK 5.0
- **语音交互**：Web Speech API 实现的语音识别和语音合成
- **面试记录**：完整的对话历史保存和数据库存储
- **响应式 UI**：基于 Tailwind CSS + shadcn-ui 的现代化界面

### 规划功能 🚧

- **练习模式**：八股文和算法题练习，用户回答后给出标准答案
- **测试模式**：计分功能，数字人面试官表情变化，0-100 分评分
- **代码编辑器**：CodeMirror 集成，支持算法题限时作答
- **视频通话**：WebRTC 视频面试模式
- **智能评估**：多维度评分系统和个性化反馈

## 技术架构

### 前端技术栈

- **框架**：Next.js 14+ (App Router) + TypeScript
- **UI 库**：Tailwind CSS + shadcn-ui 组件
- **状态管理**：Zustand (用户状态)
- **语音处理**：Web Speech API (SpeechRecognition + SpeechSynthesis)
- **实时通信**：Socket.io (语音模式)
- **AI 集成**：Vercel AI SDK 5.0 + @ai-sdk/deepseek

### 后端技术栈

- **数据库**：Supabase (PostgreSQL + pgvector)
- **认证**：Supabase Auth
- **文件存储**：Supabase Storage
- **AI 模型**：DeepSeek V3 API
- **向量搜索**：Supabase pgvector + LangChain
- **部署**：Vercel

### 数据库设计

```sql
-- 核心表结构
interviews: {
  id, user_id, status, user_messages (JSONB), ai_messages (JSONB),
  created_at, updated_at, duration, type, score, date
}

user_profiles: {
  id, user_id, avatar_url, personal_info (JSONB), work_experience (JSONB),
  project_experience (JSONB), skills (JSONB), education (JSONB)
}

user_profile_vectors: {
  id, user_id, chunk_text, metadata (JSONB), embedding (vector)
}
```

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── (guest)/           # 未认证用户页面
│   ├── (user)/            # 已认证用户页面
│   │   ├── dashboard/     # 仪表盘
│   │   ├── interview/[id]/ # 面试页面
│   │   └── profile/       # 用户资料
│   └── api/               # API 路由
├── components/            # 可复用组件
├── hooks/                 # 自定义 React Hooks
├── lib/                   # 工具库和配置
├── store/                 # 状态管理
└── types/                 # TypeScript 类型定义
```

## 核心业务流程

### 1. 用户注册与简历上传

```
用户注册 → 上传简历 PDF → 解析提取结构化数据 →
存储到 user_profiles → 生成向量嵌入 → 存储到 user_profile_vectors
```

### 2. 面试对话流程

```
创建面试 → 加载用户简历 RAG 上下文 →
AI 生成个性化问题 → 用户语音/文本回答 →
AI 流式响应 → 保存对话到数据库
```

### 3. 语音交互实现

```
用户语音输入 → Web Speech API 识别 → 文本发送给 AI →
AI 生成回复 → 文本转语音播放 → 实时 Socket.io 通信
```

## 开发状态

### 已完成 ✅

- [x] 用户认证系统
- [x] 简历解析和存储
- [x] AI 对话系统 (DeepSeek + AI SDK)
- [x] 语音识别和合成
- [x] 面试记录保存
- [x] 响应式 UI 界面
- [x] 数据库 RPC 函数

### 进行中 🚧

- [ ] 练习/测试模式切换
- [ ] 评分系统实现
- [ ] 代码编辑器集成
- [ ] 面试流程优化

### 待开发 📋

- [ ] 视频通话模式
- [ ] 算法题题库
- [ ] 智能评估系统
- [ ] 数据分析面板

## 技术亮点

1. **流式 AI 对话**：使用 AI SDK 5.0 实现低延迟的流式响应
2. **RAG 增强**：基于用户简历的个性化问题生成
3. **实时语音**：Web Speech API + Socket.io 的实时语音交互
4. **数据一致性**：PostgreSQL RPC 函数确保消息存储的原子性
5. **类型安全**：完整的 TypeScript 类型定义

## 部署配置

- **生产环境**：Vercel
- **数据库**：Supabase (PostgreSQL + pgvector)
- **AI 服务**：DeepSeek API
- **环境变量**：DEEPSEEK_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY

## 开发规范

- **代码风格**：ESLint + Prettier
- **提交规范**：Commitlint
- **包管理**：pnpm
- **语言**：中文注释，英文变量名
- **响应式**：移动端优先设计

---

**注意**：这是一个 MVP 版本，专注于核心面试功能。后续版本将逐步添加高级功能如视频通话、代码评估、智能评分等。
以上是提供给v0.dev快速生成前端应用的Prompt文本
