# 简历上传和自动解析功能 - 测试与调试指南

## 概述

本文档旨在帮助调试和验证简历上传后自动填充工作经历的功能。

## 已实现的优化

### 1. **增强的日志系统**

创建了专用的简历解析日志工具 (`src/lib/resume-parsing-logger.ts`)，提供结构化日志记录：

```typescript
// 使用示例
import { logResumeStage, resumeLogger } from "@/lib/resume-parsing-logger";

logResumeStage.pdfParsing("开始解析 PDF", { fileName: "resume.pdf" });
logResumeStage.aiAnalysis("AI 分析完成", { workExperiencesCount: 3 });
```

**日志级别:**
- ℹ️ Info: 正常流程信息
- ⚠️ Warn: 警告信息
- ❌ Error: 错误信息
- 🔍 Debug: 调试信息

### 2. **前端组件日志** (`src/components/dashboard/resume-intelligence.tsx`)

在 `handleDropAccepted` 函数中添加了详细的日志输出：

```typescript
📤 [简历上传] 开始上传
🤖 [简历上传] 开始 AI 解析...
📊 [简历上传] 服务端返回结果
✅ [简历上传] 开始填充表单数据
💼 [简历上传] 目标岗位已填充
📅 [简历上传] 工作年限已填充
🛠️ [简历上传] 技能栈已填充
📝 [简历上传] 开始填充工作经历
   1. 高级工程师 @ 科技公司
   2. 开发工程师 @ 创业公司
✨ [简历上传] 完成！
```

### 3. **服务端日志** (`src/action/upload-resume.ts`)

在关键步骤添加了详细的日志记录：
- PDF 解析阶段
- AI 分析阶段（包括每条工作经历的详细信息）
- 数据映射阶段
- 数据库更新阶段

### 4. **单元测试** (`src/components/dashboard/__tests__/resume-intelligence.test.tsx`)

创建了完整的测试套件，覆盖以下场景：
- ✅ 初始化和数据渲染
- ✅ 简历上传成功后自动填充工作经历
- ✅ 处理工作经历为空的情况
- ✅ 处理上传失败的情况
- ✅ 处理部分字段缺失的简历

## 如何测试

### 1. 运行单元测试

```bash
pnpm test src/components/dashboard/__tests__/resume-intelligence.test.tsx
```

### 2. 手动测试流程

#### 步骤 1: 准备测试简历
准备一个包含以下内容的 PDF 简历：
- 个人信息
- 工作经历（至少2条）
- 技能栈
- 教育背景

#### 步骤 2: 打开开发者工具
1. 启动开发服务器：`pnpm run dev`
2. 访问简历上传页面
3. 打开浏览器开发者工具（F12）
4. 切换到 Console 标签

#### 步骤 3: 上传简历
拖拽或选择简历文件上传。

#### 步骤 4: 查看日志输出

观察控制台的日志输出，应该看到完整的流程日志：

```
📤 [简历上传] 开始上传 { fileName: "xxx.pdf", fileSize: "1.2MB", ... }
🤖 [简历上传] 开始 AI 解析...
📊 [简历上传] 服务端返回结果 { success: true, hasData: true }
✅ [简历上传] 开始填充表单数据 { workExperiencesCount: 2 }
📝 [简历上传] 开始填充工作经历 { count: 2, data: [...] }
   1. 高级前端工程师 @ 字节跳动 { startDate: "2020-01", endDate: "2023-12" }
   2. 前端开发 @ 腾讯 { startDate: "2018-06", endDate: "2020-01" }
✅ [简历上传] 工作经历状态已更新，当前数量: 2
✨ [简历上传] 完成！
```

## 调试检查清单

如果工作经历没有自动填充，按以下顺序检查：

### ✅ 1. 检查 PDF 解析
查看日志中是否有：
```
ℹ️ [简历解析-PDF解析] PDF 解析成功
```

如果失败，检查 PDF 文件格式是否正确。

### ✅ 2. 检查 AI 分析
查看日志中是否有：
```
ℹ️ [简历解析-AI分析] AI 分析完成 { workExperiencesCount: X }
```

如果 `workExperiencesCount` 为 0，说明 AI 没有解析出工作经历，可能需要优化简历格式。

### ✅ 3. 检查数据映射
查看日志：
```
ℹ️ [简历解析-数据映射] 工作经历映射完成 { count: X, data: [...] }
```

检查映射后的数据结构是否正确。

### ✅ 4. 检查数据库更新
查看日志：
```
ℹ️ [简历解析-数据库更新] 数据库更新成功 { workExperiencesCount: X }
```

### ✅ 5. 检查前端状态更新
查看前端日志：
```
📝 [简历上传] 开始填充工作经历 { count: X, data: [...] }
```

确认 React 状态是否正确更新。

## 常见问题排查

### 问题 1: 工作经历解析为空

**可能原因:**
- PDF 格式不标准
- 工作经历在简历中的格式不规范

**解决方案:**
1. 检查 PDF 是否可以正常提取文本
2. 查看 AI 分析日志，确认 AI 是否识别到工作经历
3. 优化简历格式，使用标准结构

### 问题 2: 数据映射失败

**可能原因:**
- 数据结构不匹配
- 字段命名不一致

**解决方案:**
1. 检查 `upload-resume.ts` 中的数据映射逻辑
2. 确保 `workExperiences` 字段正确映射到 `work_experiences`

### 问题 3: 前端状态未更新

**可能原因:**
- 异步状态更新问题
- React 状态管理问题

**解决方案:**
1. 检查 `setWorkExperiences` 是否被正确调用
2. 确认 `result.data.work_experiences` 存在且不为空
3. 查看前端日志确认数据流

## 导出日志用于调试

如需导出完整日志用于分析：

```typescript
// 在浏览器控制台执行
import { resumeLogger } from "@/lib/resume-parsing-logger";
console.log(resumeLogger.export());
```

这将输出 JSON 格式的完整日志历史。

## 性能优化建议

1. **限制日志数量**: 日志系统已设置最大保存 100 条记录
2. **生产环境**: 考虑在生产环境中禁用详细日志
3. **异步处理**: 确保日志记录不阻塞主流程

## 后续优化方向

1. **错误重试机制**: 对于 AI 解析失败的情况，添加重试逻辑
2. **用户反馈**: 在 UI 中显示解析进度和结果
3. **数据校验**: 添加更严格的数据校验和格式化
4. **离线缓存**: 考虑缓存解析结果，避免重复解析

---

**最后更新**: 2025-12-13
**作者**: AI Assistant
