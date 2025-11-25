[4 tools called]

基于你提供的现有代码库结构、功能描述（README）以及“抛弃现有设计，使用AI重构”的需求，我为你设计了一套详细的 **AI Design Prompt（设计提示词）**。

你可以将这段提示词直接发送给 **v0.dev**、**Lovable** 或 **Cursor 的 Composer (配合 claude-3.5-sonnet)** 来生成全新的界面代码。

---

### 🎨 AI 重构设计提示词 (Prompt)

**Role:** 
你是一位世界级的高级 UI/UX 设计师和全栈工程师，擅长设计面向年轻一代的现代 Web 应用。

**Goal:** 
重新设计名为 "Young Interview Expert" (AI 面试官智能体) 的全栈应用。我们需要抛弃旧的 CSS，采用全新的设计系统。请基于 `shadcn/ui` + `Tailwind CSS` 创建一套现代、专业且具有活力的界面。

**Constraints:**
1.  **禁止使用**：默认的蓝色 (Blue) 或靛青色 (Indigo) 作为主色调。
2.  **风格**：极简主义 (Minimalist)、高科技感 (Tech-forward)、值得信赖 (Trustworthy)。
3.  **配色建议**：使用 **Emerald (祖母绿/深绿)** 代表“成长与机会”，搭配 **Neutral (中性灰)** 和 **Violet (紫罗兰)** 作为 AI 元素的点缀。支持明亮/暗黑模式。
4.  **语言**：简体中文。

**Product Positioning:**
这是一个针对互联网技术岗求职者（校招/社招）的 AI 模拟面试平台。它不仅是一个工具，更是一个帮助用户成长的“智能导师”。核心体验包括：简历解析、语音/视频模拟面试、实时代码考核、面试评分报告。

**Pages & Features Breakdown:**

请按照以下页面结构进行设计（请确保组件的可复用性）：

#### 1. 公共/着陆页 (Public/Landing)
*   **Page:** `LandingPage`
*   **Vibe:** 强烈的视觉冲击力，展示“AI 面试”的未来感。
*   **Sections:**
    *   **Hero:** 醒目的 Slogan ("搞定你的下一次技术面试")，动态的 "开始模拟" CTA 按钮。
    *   **Features:** 3个卡片展示核心能力：简历深度解析、多模式面试（语音/文字）、智能评分报告。
    *   **Social Proof:** 用户评价或“已帮助 X 位同学拿到 Offer”的统计数据。
    *   **Footer:** 极简底部导航。

#### 2. 认证页 (Auth)
*   **Pages:** `LoginPage`, `RegisterPage`
*   **Design:** 干净的居中卡片布局，右侧（或背景）配以抽象的 3D 插图或 AI 相关的几何图形，营造专业感。
*   **Form:** 邮箱/密码输入，第三方登录（Github/Google）按钮。

#### 3. 用户仪表盘 (Dashboard)
*   **Page:** `Dashboard` (App Shell Layout)
*   **Layout:** 左侧侧边栏导航 (Dashboard, Profile, History, Settings)，顶部 Header 显示用户信息和积分/状态。
*   **Key Modules:**
    *   **Welcome Banner:** "你好，[User]！准备好挑战今天的面试了吗？"
    *   **Quick Start Card:** 一个醒目的大卡片，点击触发“创建新面试”流程（选择简历 -> 选择职位 -> 选择模式）。
    *   **Stats Row:** 展示已面试次数、平均得分、最佳表现等数据概览。
    *   **Recent Activity:** 最近的面试记录列表（卡片式或列表式），包含时间、职位、得分和“查看详情”按钮。

#### 4. 个人资料 & 简历 (Profile)
*   **Page:** `ProfilePage`
*   **Design:** 两栏布局。
*   **Left Column (User Info):** 头像上传、基本信息表单（姓名、求职意向）。
*   **Right Column (Resume Center):** 
    *   **Upload Area:** 拖拽上传 PDF 简历的区域，带有上传进度动画。
    *   **Resume Preview:** 解析后的简历内容预览/编辑区（Markdown 或结构化展示）。
    *   **Skills Tags:** 从简历中提取的技术栈标签云。

#### 5. 面试直播间 (Interview Room) - **核心页面**
*   **Page:** `InterviewPage`
*   **Layout:** 沉浸式布局，隐藏不必要的侧边栏。
*   **Split View (Desktop):**
    *   **Left/Main Area (Interaction):** 
        *   **Avatar/Video:** AI 面试官的数字人形象或动态波纹 (Audio Visualizer)。
        *   **Chat Stream:** 类似 ChatGPT 的对话流，气泡设计要区分“面试官”和“我”。支持 Markdown 渲染（用于代码块）。
    *   **Right Panel (Tools):**
        *   **Code Editor:** 内嵌 Monaco Editor/CodeMirror，用于手撕代码环节。
        *   **Question Card:** 当前正在回答的问题提示卡。
    *   **Bottom Bar (Controls):** 麦克风开关、结束面试按钮、发送文字输入框（支持语音输入切换）。
*   **Voice Mode:** 强调波纹动画和实时语音转文字 (STT) 的字幕展示。

#### 6. 面试报告 (Report/History)
*   **Page:** `InterviewDetail`
*   **Design:** 类似“体检报告”的专业数据页。
*   **Modules:**
    *   **Overall Score:** 大号的评分仪表盘 (0-100)。
    *   **Radar Chart:** 能力雷达图 (基础知识, 算法, 沟通, 项目经验)。
    *   **Timeline/Transcript:** 面试全过程回顾，AI 在每一轮对话旁边的具体点评（高亮建议）。
