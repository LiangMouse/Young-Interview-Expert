# 项目背景

我正在开发一个AI模拟面试应用“小面”，使用Next.js框架。核心功能包括：用户上传简历、解析并存储到Supabase（包括RAG知识库），然后进行实时语音面试模拟。应用只扮演面试官角色，帮助用户练习面试，无作弊用途。

当前已实现：PDF解析（用LangChain PDFLoader）、简历分析（用DeepSeek V3提取结构化数据）、表单填充、保存到Supabase（profiles表和resume_vectors表 for RAG）。

高优先级需求：

1. 实现语音对话交互：在interview/[id]路由下，用户与AI面试官实时语音交流（STT转录用户输入、TTS输出AI响应、Socket.io实时通信，支持打断）。
2. 结合RAG优化系统提示词：用Supabase pgvector检索用户简历细粒度信息（工作经历、项目、技术栈、意向岗位），生成针对性面试问题。

目标：生成完整代码，实现这些功能。确保代码兼容Next.js Server Actions和客户端组件，优化低延迟和中文支持。

# 当前技术栈和配置

- 前端：Next.js 14+ (App Router)，React Hooks (useState, useEffect, useRef)。
- 后端：Next.js API Routes 或 Server Actions；Supabase (Auth, Database with pgvector, Storage)。
- AI：DeepSeek V3 (via @langchain/openai 兼容)；LangChain.js (for RAG, SupabaseVectorStore, OpenAIEmbeddings)。
- 语音：浏览器Web Speech API (STT/TTS)，Socket.io (实时通信)。
- 环境变量：DEEPSEEK_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY。
- 数据库表：
  - profiles: 存用户结构化数据 (JSONB)。
  - resume_vectors: 存RAG向量 (id, user_id, chunk_text, metadata {type: 'project'等}, embedding)。
  - interviews: 存面试记录 (interview_id, user_id, question, answer, ai_response, timestamp)。
- 依赖已安装：langchain, @langchain/community, @langchain/openai, socket.io, socket.io-client, pdf-parse, @supabase/supabase-js...

# 具体需求细节

## 需求1: 语音对话交互（STT + TTS + 实时对话）

- 页面：src/pages/interview/[id].tsx (动态路由，id为面试会话ID)。
- 流程：
  1. 用户进入页面，点击“开始面试” → 发送初始消息'开始面试'到Socket.io。
  2. AI生成首个问题（TTS播放）。
  3. 用户点击“开始回答” → STT实时转录语音（中文支持）。
  4. 转录发送到Socket.io → 后端用DeepSeek V3 + RAG生成响应 → Socket回传 → TTS播放。
  5. 支持“打断AI”按钮（停止TTS）。
  6. 每次对话存到Supabase interviews表。
- Socket.io配置：在src/pages/api/socket.ts 中初始化服务器，监听'user-speech'事件，触发后端LLM处理。
- STT：用Web Speech API (continuous: true, lang: 'zh-CN')。
- TTS：用SpeechSynthesisUtterance (lang: 'zh-CN', rate: 0.9)。
- 错误处理：未登录提示、STT错误日志。
- UI：简单按钮和显示区（用户转录 + AI响应）。

## 需求2: 结合RAG优化系统提示词（细粒度面试）

- 在后端处理中（src/actions/interview.ts Server Action），用RAG增强Prompt。
- 检索逻辑：
  - 用SupabaseVectorStore.similaritySearch(query, 3, {user_id, type: ['project', 'skills_job'] 等过滤})。
  - 初始问题（'开始面试'）：用意向岗位/技术栈驱动。
  - 后续问题：基于用户回答 + 检索结果，优先项目细节/技术深度。
- Prompt模板：
  - 注入relevantDocs (e.g., 项目经历: "电商平台: 使用React优化性能")。
  - 规则：只提问/引导，不解答；针对性强（如“你提到React，在电商项目中如何处理状态？”）。
  - 调用llm.invoke(prompt)，返回纯文本响应。
- 集成：Socket.io事件中调用processInterviewSpeech(transcript, interviewId, userId)。

# 预期输出

逐渐完成需求

确保代码：

- 异步处理（async/await）。
- 安全（API Key不暴露前端，Auth检查）。
- 兼容浏览器（Chrome优先）。
- 注释清晰，便于调试。
- 如果有优化建议（如用ElevenLabs替换TTS），列在末尾。
- 重要信息在生成阶段用中文同步给我
- 当有不确定的信息的时候可以去详细查证或直接问我，等待我的输入

开始生成代码！
