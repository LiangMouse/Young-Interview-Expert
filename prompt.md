# Young-Interview-Expert

做一个自己用着舒服，中文互联网技术岗求职者（用户）会用第二次的AI 面试官智能体应用

## 应用特点

### 功能特点

- 可以导入求职者简历，针对简历提问问题
- 面试可以选择视频通话模式，也可以选择语音对话模式(当前只实现语音对话模式)
- 可以选择练习与测试模式，练习模式 AI 对于具体的八股/算法问题 可以再用户回答完毕后给出答案，测试模式AI可以计分，数字人面试官形象会有表情变化并在最终给出最高100分的成绩
- 保存每一次的面试记录，并评估保留面试中的对话
- 支持面试官出算法题或手撕题目，并让应聘者限时作答，运行

## 技术栈

- Supabase：做数据库和auth认证
- Tailwindcss+shadcn-ui: 前端UI
- Nextjs+TS: 全栈能力
- Vercel: 作部署
- CodeMirror： 做代码编辑器
- i18next: 国际化文本能力，优先汉语 

## 渐进式开发

基础功能搭建，当前目标 -> 迅速实现MVP版本

MVP 版本
- 用户注册与登录（Supabase 认证）
- 简历导入功能（支持文件上传）
- 语音对话模式实现（先实现语音对话，视频通话后续迭代）
- 美观的面试问答交互界面，应用页面
- 部署到vercel
- 核心面试功能实现

面试功能完善
- 练习模式：支持八股文和算法题，用户回答后给出标准答案
- 测试模式：实现计分功能，数字人面试官表情变化
- 面试记录保存与管理
- 高级功能完善
- 视频通话模式集成
- 限时作答功能及代码运行环境（CodeMirror 集成）
- 面试对话智能评估与反馈
- 优化与扩展

细节优化
- UI/UX 优化（使用 Tailwindcss + shadcn-ui）
- 部署与性能调优（Vercel）
- 多轮对话与上下文管理
- i18next多语言支持(之前只用做汉语)

```txt
Design a web interface for a Chinese-language AI interview app targeted at Gen Z users (college students born after 1995). The interface should feel warm, playful, and emotionally comfortable.

Layout:
- On the left: a friendly, semi-realistic digital avatar (数字人) for AI interviewer, speaking via animated speech bubbles or voice waveforms (语音波纹动画)，语音对话优先。
- Center: a clean, messenger-style chat interface，支持 emoji 表达（👏👍❓），带上下文滚动交互。
- Right side: a collapsible card UI (折叠卡片组件) for uploaded resume preview (简历预览) and AI feedback (智能点评)，支持文件上传与解析。

Style:
- Use a modern pastel color palette: sky blue, lavender, soft beige (天蓝色+浅紫色+米白色)
- Rounded corners, soft shadows, glassmorphism, plenty of whitespace (圆角 + 投影 + 玻璃拟态 + 留白)
- Minimalist but humanized interface, not intimidating

功能关键词（MVP）：
- 注册登录（Supabase）
- 支持中文简历上传（PDF/doc）
- 中文语音问答交互（练习+测试两种模式）
- 面试记录保存
- 可部署（适配 Vercel）

所有文本展示请使用中文，适配中文求职用户的习惯和阅读体验。

This UI is for the MVP version and should support smooth extension to video mode, algorithm challenge cards, and scoring systems in later versions.
```
以上是提供给v0.dev快速生成前端应用的Prompt文本