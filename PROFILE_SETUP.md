# 个人信息页面设置指南

## 概述

这个个人信息页面组件为AI面试助手应用提供了完整的用户资料管理功能，包括：

- 用户基本信息展示和编辑
- 求职意向和技能标签管理
- 个人简介编辑
- 简历上传功能（UI已完成，后端待实现）

## 功能特点

### 🎨 设计风格
- 遵循项目整体设计风格：天蓝色+浅紫色+米白色配色
- 使用shadcn-ui组件库
- 玻璃拟态效果和圆角设计
- 响应式布局，支持桌面和移动端

### 📝 用户信息字段
- **基本信息**：姓名、当前职位、所在地区、联系电话、工作经验
- **求职信息**：求职意向、技能标签、教育背景
- **个人简介**：支持多行文本编辑
- **简历管理**：文件上传区域（待完善）

### 🔒 安全特性
- 行级安全策略（RLS）
- 用户只能访问和修改自己的资料
- API路由鉴权保护

## 文件结构

```
src/
├── app/
│   ├── (user)/
│   │   └── profile/
│   │       ├── page.tsx              # 服务端组件
│   │       └── profile-client.tsx    # 客户端组件
│   └── api/
│       └── profile/
│           └── route.ts              # API路由
├── types/
│   └── profile.ts                    # 类型定义
└── middleware.ts                     # 路由保护中间件

supabase_migration.sql                # 数据库迁移脚本
```

## 数据库设置

### 1. 运行迁移脚本

在Supabase控制台的SQL编辑器中运行 `supabase_migration.sql` 文件：

```sql
-- 创建用户资料表
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  location TEXT,
  job_title TEXT,
  job_intention TEXT,
  skills TEXT[] DEFAULT '{}',
  experience_years INTEGER DEFAULT 0,
  education TEXT,
  resume_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. 验证表结构

确保表已正确创建，包括：
- 主键和外键约束
- 行级安全策略（RLS）
- 索引和触发器

## API 端点

### GET /api/profile
获取当前用户的资料信息

**响应示例：**
```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "full_name": "张三",
    "bio": "资深前端开发工程师...",
    "phone": "13800138000",
    "location": "北京",
    "job_title": "前端开发工程师",
    "job_intention": "高级前端开发工程师",
    "skills": ["React", "TypeScript", "Node.js"],
    "experience_years": 3,
    "education": "计算机科学与技术本科",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### POST /api/profile
创建或更新用户资料

**请求体：**
```json
{
  "full_name": "张三",
  "bio": "资深前端开发工程师...",
  "phone": "13800138000",
  "location": "北京",
  "job_title": "前端开发工程师",
  "job_intention": "高级前端开发工程师",
  "skills": ["React", "TypeScript", "Node.js"],
  "experience_years": 3,
  "education": "计算机科学与技术本科"
}
```

## 使用方法

### 1. 访问个人资料页面

用户登录后，可以通过以下方式访问：
- 从仪表板点击"个人资料"卡片
- 直接访问 `/profile` 路径

### 2. 编辑资料

1. 点击"编辑资料"按钮进入编辑模式
2. 修改各个字段的信息
3. 点击"保存"按钮提交更改
4. 点击"取消"按钮放弃更改

### 3. 技能标签

- 在编辑模式下，在技能字段中输入技能，用逗号分隔
- 保存后会自动转换为标签显示
- 例如：`React, TypeScript, Node.js`

## 待完善功能

### 1. 简历上传
- [ ] 实现文件上传API
- [ ] 支持PDF、DOC、DOCX格式
- [ ] 文件大小限制和验证
- [ ] 简历预览功能

### 2. 头像上传
- [ ] 用户头像上传功能
- [ ] 图片裁剪和压缩
- [ ] 头像预览

### 3. 数据验证
- [ ] 前端表单验证
- [ ] 后端数据验证
- [ ] 错误提示优化

### 4. 用户体验优化
- [ ] 加载状态优化
- [ ] 成功/错误提示
- [ ] 自动保存草稿

## 故障排除

### 常见问题

1. **无法访问个人资料页面**
   - 检查用户是否已登录
   - 确认中间件配置正确

2. **保存资料失败**
   - 检查数据库连接
   - 确认RLS策略配置
   - 查看浏览器控制台错误

3. **页面样式异常**
   - 确认shadcn-ui组件正确安装
   - 检查Tailwind CSS配置

### 调试技巧

1. 查看浏览器开发者工具的网络标签
2. 检查Supabase控制台的日志
3. 在API路由中添加console.log进行调试

## 贡献指南

如需扩展或修改个人资料功能：

1. 更新类型定义 (`src/types/profile.ts`)
2. 修改数据库表结构（如需要）
3. 更新API路由逻辑
4. 调整前端组件
5. 更新此文档

## 技术栈

- **前端**: Next.js 15, React 19, TypeScript
- **UI组件**: shadcn-ui, Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
