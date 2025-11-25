# Figma 设计系统规则 - AI 面试助手

> 本文档用于 Figma MCP 集成，定义了从 Figma 设计到代码的转换规则

## 🎯 项目概览

- **项目名称**: AI Interview Expert（小面）
- **技术栈**: Next.js 15 + React 19 + Tailwind CSS v4 + TypeScript
- **UI 框架**: shadcn/ui + Radix UI
- **设计风格**: 极简、冷静、现代、科技感、专业
- **目标用户**: 18-35岁高知程序员

---

## 1. Design Token 定义

### 位置
**主文件**: `src/app/globals.css`

使用 Tailwind v4 的 `@theme inline` 语法定义所有设计令牌。

### 颜色系统（Color Tokens）

#### 主色调（Primary）
```css
/* Light Mode */
--primary: oklch(0.28 0.035 200);              /* #1f3a3d - 深青绿 */
--primary-foreground: oklch(0.97 0.005 180);   /* 白色文字 */

/* Dark Mode */
--primary: oklch(0.48 0.055 195);              /* #3b6a6d - 明亮青绿 */
--primary-foreground: oklch(0.98 0.002 180);
```

**Figma 映射规则**:
- Figma 中的 `Primary` 颜色 → `bg-primary` / `text-primary`
- **禁止**: 任何蓝色（sky-*）或紫色（purple-*）
- **原则**: 低饱和度、中低明度

#### 强调色（Accent）
```css
--accent: oklch(0.66 0.095 65);                /* #c58b3b - 琥珀色 */
--accent-foreground: oklch(0.18 0.008 240);
```

**使用场景**:
- 状态标签（Badge）
- 进度指示器
- 引导性按钮（次要）
- 图标强调色

#### 功能色
```css
--color-success: oklch(0.65 0.18 145);         /* #49de50 */
--color-success-hover: oklch(0.58 0.18 145);   /* #42c748 */
--color-info: oklch(0.58 0.045 195);
--destructive: oklch(0.577 0.245 27.325);
```

#### 背景与表面（Surface）
```css
/* Light Mode */
--background: oklch(0.981 0.002 240);          /* #f7f8fa */
--card: oklch(1 0 0);                          /* #ffffff */
--muted: oklch(0.94 0.004 240);

/* Dark Mode */
--background: oklch(0.15 0.008 240);           /* #0f1418 */
--card: oklch(0.19 0.01 240);                  /* #151b21 */
--muted: oklch(0.21 0.01 240);
```

**Figma 映射规则**:
- 页面背景 → `bg-background`
- 卡片/容器 → `bg-card`
- 次级区域 → `bg-muted`
- **重要**: 卡片与背景对比度必须为 2-4% 明度差

#### 文字颜色
```css
/* Light Mode */
--foreground: oklch(0.18 0.008 240);           /* #0f1418 - 主文字 */
--muted-foreground: oklch(0.48 0.012 240);     /* #4f5965 - 次级文字 */

/* Dark Mode */
--foreground: oklch(0.96 0.003 240);           /* #eff2f5 */
--muted-foreground: oklch(0.68 0.015 240);
```

**Figma 映射规则**:
- 标题、正文 → `text-foreground` 或 `text-card-foreground`
- 描述、说明 → `text-muted-foreground`
- 对比度要求 >= 4.5:1 (WCAG AA)

#### 边框与输入
```css
/* Light Mode */
--border: oklch(0.88 0.005 240);               /* #d4d8de */
--input: oklch(0.88 0.005 240);
--ring: oklch(0.28 0.035 200);                 /* Focus ring */

/* Dark Mode */
--border: oklch(0.24 0.01 240);                /* #1f262e */
--input: oklch(0.26 0.012 240);
--ring: oklch(0.48 0.055 195);
```

---

### 字体系统（Typography Tokens）

#### 字体家族
```css
--font-sans: var(--font-geist-sans);           /* Geist Sans */
--font-mono: var(--font-geist-mono);           /* Geist Mono */
```

**备用字体栈**:
- Sans: `'Inter', 'SF Pro', system-ui, sans-serif`
- Mono: `'IBM Plex Mono', 'Courier New', monospace`

#### 字体比例（Type Scale）
```
H1: 32px / 40px / 600 (Bold)
H2: 24px / 32px / 600 (Semibold)
H3: 20px / 28px / 600 (Semibold)
Body-L: 16px / 24px / 500 (Medium)
Body-S: 14px / 22px / 500 (Medium)
Caption: 13px / 20px / 500 (Medium)
```

**Tailwind 类名映射**:
```tsx
// Figma Text Style → React Component
H1 → <h1 className="text-3xl font-semibold leading-tight">
H2 → <h2 className="text-2xl font-semibold">
H3 → <h3 className="text-xl font-semibold">
Body-L → <p className="text-base">
Body-S → <p className="text-sm">
Caption → <span className="text-xs">
```

---

### 间距系统（Spacing Tokens）

#### 8pt Grid System
```
scale: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64]

Tailwind 映射:
4px  → p-1, m-1, gap-1
8px  → p-2, m-2, gap-2
12px → p-3, m-3, gap-3
16px → p-4, m-4, gap-4
20px → p-5, m-5, gap-5
24px → p-6, m-6, gap-6
32px → p-8, m-8, gap-8
40px → p-10, m-10, gap-10
48px → p-12, m-12, gap-12
64px → p-16, m-16, gap-16
```

#### 语义化间距
```
页面边距:    40px (p-10)
区块间距:    48px (gap-12)
组件间距:    24px (gap-6)
元素间距:    16px (gap-4)
紧密间距:    8px (gap-2)
```

---

### 圆角系统（Radius Tokens）

```css
--radius-xs: 0.375rem;   /* 6px */
--radius-sm: 0.625rem;   /* 10px */
--radius-md: 0.875rem;   /* 14px - 全局默认 */
--radius-lg: 1.25rem;    /* 20px */
--radius-xl: 1.5rem;     /* 24px */
```

**组件应用规则**:
```
按钮: rounded-md (14px)
输入框: rounded-md (14px)
卡片: rounded-lg (20px)
对话框: rounded-xl (24px)
Badge: rounded-lg (8-10px)
Avatar: rounded-full
```

---

### 阴影系统（Shadow Tokens）

```css
--shadow-s: 0 1px 2px oklch(0.1 0 0 / 0.18);
--shadow-m: 0 8px 20px oklch(0.1 0 0 / 0.12);
--shadow-l: 0 18px 40px oklch(0.1 0 0 / 0.18);
```

**使用场景**:
- `shadow-s`: 输入框、小卡片
- `shadow-m`: 按钮、功能卡片
- `shadow-l`: 模态框、浮层

**Figma 映射**:
- Drop Shadow Y ≤ 2px → `shadow-s`
- Drop Shadow Y 8-12px → `shadow-m`
- Drop Shadow Y ≥ 18px → `shadow-l`

---

## 2. 组件库（Component Library）

### 位置
```
src/components/ui/          # shadcn/ui 组件
├── button.tsx
├── input.tsx
├── card.tsx
├── badge.tsx
├── avatar.tsx
├── dialog.tsx
├── label.tsx
├── separator.tsx
├── tooltip.tsx
└── ...
```

### 组件架构
- **基础**: Radix UI（无样式原语）
- **样式**: Tailwind CSS + CVA（class-variance-authority）
- **组合**: 使用 `cn()` 工具合并类名

---

### 按钮组件（Button）

**文件**: `src/components/ui/button.tsx`

#### Variants
```tsx
variants: {
  variant: {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-border bg-transparent hover:bg-muted",
    ghost: "hover:bg-muted hover:text-foreground"
  },
  size: {
    default: "h-11 px-6",    // 44px
    sm: "h-9 px-4",          // 36px
    lg: "h-12 px-8"          // 48px
  }
}
```

#### Figma 到代码映射
```
Figma Button Layer → 分析:
1. 背景色 #1f3a3d → variant="primary"
2. 高度 44px → size="default"
3. 圆角 14px → (自动应用 rounded-md)
4. 阴影 → className="shadow-m"

生成代码:
<Button variant="primary" size="default" className="shadow-m">
  登录
</Button>
```

---

### 输入框组件（Input）

**文件**: `src/components/ui/input.tsx`

#### 基础样式
```tsx
className = cn(
  "flex h-11 w-full rounded-md border border-border",
  "bg-card/50 px-4 py-2 text-base",
  "placeholder:text-muted-foreground",
  "focus:ring-2 focus:ring-primary focus:ring-offset-2",
  "disabled:opacity-40"
)
```

#### Figma 映射规则
```
Figma Input Field → 检查:
1. 高度: 44px → h-11
2. 背景: 半透明白色 → bg-card/50
3. 边框: #d4d8de → border-border
4. 圆角: 14px → rounded-md
5. 内边距: 12-16px → px-4 py-2

带图标的输入框:
<div className="relative">
  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
  <Input className="pl-10" />
</div>
```

---

### 卡片组件（Card）

**文件**: `src/components/ui/card.tsx`

#### 结构
```tsx
<Card className="bg-card border-border rounded-lg shadow-m">
  <CardHeader>
    <CardTitle>标题</CardTitle>
    <CardDescription>描述</CardDescription>
  </CardHeader>
  <CardContent>内容</CardContent>
  <CardFooter>底部</CardFooter>
</Card>
```

#### Figma 映射
```
Figma Card Frame → 分析:
1. 背景: #ffffff → bg-card
2. 边框: 1px #d4d8de → border border-border
3. 圆角: 20px → rounded-lg
4. 阴影: 0 8px 20px → shadow-m
5. 内边距: 32px → p-8

半透明卡片（认证页面）:
className="bg-card/70 backdrop-blur-md border-border/30 shadow-xl"
```

---

### 标签组件（Badge）

**文件**: `src/components/ui/badge.tsx`

#### Variants
```tsx
variants: {
  variant: {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    neutral: "bg-muted text-muted-foreground"
  }
}
```

#### Figma 映射
```
Figma Badge → 分析:
1. 背景: 主色 10% 透明 → variant="primary"
2. 文字: 主色 → (自动应用)
3. 高度: 28px → h-7
4. 圆角: 8px → rounded-lg
5. 内边距: 4px 12px → px-3 py-1

生成代码:
<Badge variant="primary">分数系统</Badge>
```

---

## 3. 框架与库

### UI 框架
- **React 19** - 组件库
- **Next.js 15** - 应用框架（App Router）
- **TypeScript 5** - 类型系统

### 样式系统
- **Tailwind CSS v4** - 原子化 CSS
- **@theme inline** - 设计令牌定义（不需要 tailwind.config.ts）
- **tailwind-merge** - 类名合并工具

### UI 组件库
- **Radix UI** - 无样式原语
- **shadcn/ui** - 组件模板
- **lucide-react** - 图标库（1.5px stroke）

### 动画与交互
- **framer-motion** - 复杂动画
- **tailwindcss-animate** - 简单过渡

---

## 4. 资源管理

### 图片与资源
```
public/
├── ai-avatar.png
├── favicon.svg
├── lottie/
└── ...
```

**引用方式**:
```tsx
import Image from 'next/image'

<Image 
  src="/ai-avatar.png" 
  alt="AI Avatar"
  width={64}
  height={64}
  className="rounded-md"
/>
```

### 优化技术
- Next.js Image 自动优化
- WebP 格式优先
- 懒加载（loading="lazy"）

---

## 5. 图标系统

### 库: lucide-react

#### 使用规范
```tsx
import { MessageCircle, Mail, Lock } from 'lucide-react'

// 标准尺寸
<MessageCircle className="w-4 h-4" />  // 16px - 小
<MessageCircle className="w-5 h-5" />  // 20px - 中
<MessageCircle className="w-6 h-6" />  // 24px - 大
<MessageCircle className="w-8 h-8" />  // 32px - 特大

// 颜色
className="text-muted-foreground"      // 次级图标
className="text-foreground"            // 主要图标
className="text-primary"               // 强调图标
```

#### Figma 图标映射
```
Figma Icon → Lucide React:

1. 查找对应图标名（https://lucide.dev）
2. 提取尺寸（width/height）
3. 提取颜色 → 映射到 text-* 类
4. 检查 stroke width（应为 1.5px）

示例:
Figma: Mail icon, 16x16, #4f5965
Code: <Mail className="w-4 h-4 text-muted-foreground" />
```

---

## 6. 样式方法论

### CSS 方法
- **Tailwind Utility Classes** - 主要方式
- **CSS Variables** - 主题切换
- **Component Props** - 动态样式

### 全局样式
**位置**: `src/app/globals.css`

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground m-0;
  }
}

@layer components {
  .auth-layout {
    @apply flex items-center justify-center mx-auto max-w-7xl min-h-screen;
  }
}
```

### 响应式设计
```tsx
// Tailwind 断点
sm:  640px   // 移动端
md:  768px   // 平板
lg:  1024px  // 桌面
xl:  1280px  // 大屏

// 使用方式
<div className="px-4 sm:px-8 lg:px-16">
  <h1 className="text-2xl sm:text-3xl lg:text-4xl">
</div>
```

---

## 7. 项目结构

```
src/
├── app/                      # Next.js App Router
│   ├── (guest)/             # 未认证路由组
│   │   └── auth/            # 认证页面
│   │       ├── login/
│   │       └── register/
│   ├── (user)/              # 认证路由组
│   │   ├── dashboard/       # 仪表盘
│   │   ├── interview/       # 面试页面
│   │   └── profile/         # 个人资料
│   ├── api/                 # API 路由
│   └── globals.css          # 全局样式
├── components/
│   ├── ui/                  # shadcn/ui 组件
│   └── ...                  # 业务组件
├── lib/                     # 工具函数
├── hooks/                   # React Hooks
├── store/                   # Zustand 状态管理
└── types/                   # TypeScript 类型
```

---

## 8. Figma 到代码转换规则

### 自动映射表

#### 颜色映射
```
Figma Fill Color → Tailwind Class

#1f3a3d → bg-primary, text-primary
#c58b3b → bg-accent, text-accent
#49de50 → bg-success
#f7f8fa → bg-background
#ffffff → bg-card
#0f1418 → text-foreground
#4f5965 → text-muted-foreground
#d4d8de → border-border

任何蓝色/紫色 → ⚠️ 警告：不符合设计系统
```

#### 间距映射
```
Figma Padding/Margin → Tailwind Class

4px → p-1, m-1
8px → p-2, m-2
16px → p-4, m-4
24px → p-6, m-6
32px → p-8, m-8
40px → p-10, m-10
48px → p-12, m-12

非 8 倍数 → ⚠️ 警告：不符合 8pt 系统
```

#### 圆角映射
```
Figma Border Radius → Tailwind Class

6px → rounded-sm
10px → rounded
14px → rounded-md (默认)
20px → rounded-lg
24px → rounded-xl
50%/Full → rounded-full
```

#### 阴影映射
```
Figma Drop Shadow → Tailwind Class

Y: 1-2px, Blur: 2-4px → shadow-s
Y: 8-12px, Blur: 20-24px → shadow-m
Y: 18-24px, Blur: 40-48px → shadow-l
```

---

### 组件识别规则

#### 识别按钮
```
条件:
1. 有背景色
2. 有文字标签
3. 高度 36-48px
4. 有圆角
5. 可能有图标

→ 生成 <Button> 组件
```

#### 识别输入框
```
条件:
1. 矩形框
2. 有边框
3. 高度 40-48px
4. 有 placeholder 文字
5. 可能有图标

→ 生成 <Input> 组件
```

#### 识别卡片
```
条件:
1. 容器框
2. 有背景色（通常白色）
3. 有阴影
4. 包含多个子元素
5. 有内边距

→ 生成 <Card> 组件
```

---

### 布局转换规则

#### Auto Layout → Flexbox
```
Figma Auto Layout:
- Direction: Vertical → flex flex-col
- Direction: Horizontal → flex flex-row
- Align: Center → items-center
- Justify: Space Between → justify-between
- Gap: 16 → gap-4
```

#### Frame → Container
```
Figma Frame → 分析:
1. 固定宽度 → w-[400px] 或 max-w-md
2. 填充父级 → w-full
3. 居中 → mx-auto
4. 内边距 → p-{n}
```

---

## 9. 特殊场景处理

### 认证页面
```tsx
// 布局结构
<div className="flex items-center justify-center p-4">
  <div className="w-full max-w-md">
    {/* Logo */}
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-m">
        <MessageCircle className="w-8 h-8 text-primary-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">小面</h1>
      <p className="text-muted-foreground mt-2">欢迎回来，开始你的面试练习之旅</p>
    </div>
    
    {/* Card */}
    <Card className="backdrop-blur-md bg-card/70 border-border/30 shadow-xl rounded-3xl">
      {/* 表单内容 */}
    </Card>
  </div>
</div>
```

### Dashboard 页面
```tsx
// 顶部导航
<nav className="h-16 bg-card/80 backdrop-blur-md border-b border-border/20 px-10">
  {/* Logo + 导航 */}
</nav>

// 欢迎区域
<section className="py-12 px-10">
  <h1 className="text-3xl font-bold text-foreground">你好，梁爽！👋</h1>
  <p className="text-muted-foreground mt-2">欢迎回到AI面试助手</p>
</section>

// 功能卡片（2列网格）
<div className="grid grid-cols-2 gap-12 px-10">
  <Card className="p-8">
    <div className="w-12 h-12 rounded-xl bg-success flex items-center justify-center mb-4">
      <Play className="w-6 h-6 text-white" />
    </div>
    <h3 className="text-xl font-semibold mb-2">开始面试</h3>
    <p className="text-muted-foreground">开始新的AI模拟面试</p>
  </Card>
</div>
```

---

## 10. 验证检查清单

### Figma 设计导入前检查
- [ ] 所有颜色符合设计系统（无蓝紫色）
- [ ] 间距遵循 8pt 网格
- [ ] 圆角统一（14px, 20px, 24px）
- [ ] 阴影方向一致（向下）
- [ ] 文字对比度 >= 4.5:1
- [ ] 组件命名清晰
- [ ] 使用 Auto Layout
- [ ] Icon 来自 Lucide React

### 代码生成后检查
- [ ] 使用正确的组件（Button, Input, Card...）
- [ ] 应用正确的 variant
- [ ] 间距类名正确（p-*, m-*, gap-*）
- [ ] 响应式断点合理
- [ ] 无硬编码颜色
- [ ] TypeScript 类型正确

---

## 11. 常见问题处理

### Q1: Figma 中有渐变背景
```
❌ 蓝紫渐变: from-sky-400 to-purple-400
✅ 替换为: bg-primary

❌ 绿色渐变: from-green-400 to-emerald-400
✅ 替换为: bg-success
```

### Q2: 颜色不在设计系统中
```
1. 检查是否为旧设计
2. 映射到最接近的系统颜色
3. 如需新颜色，先更新 globals.css
```

### Q3: 间距不是 8 的倍数
```
原则: 向最近的 8 倍数取整
例: 15px → 16px (p-4)
    18px → 16px (p-4) 或 20px (p-5)
```

---

## 12. 工具与插件

### Figma 插件
- **Iconify** - 导入 Lucide React 图标
- **Stark** - 对比度检查
- **Figma to Code** - 自动生成代码

### VS Code 扩展
- **Tailwind CSS IntelliSense** - 类名提示
- **Prettier** - 代码格式化
- **ESLint** - 代码检查

---

## 更新日志

- **v1.0.0** (2025-11-17) - 初始版本，基于新设计系统
- 移除所有蓝紫色渐变
- 应用深青绿主色系
- 建立完整的令牌系统
- 定义 Figma 到代码映射规则

---

**最后更新**: 2025年11月17日  
**维护者**: Design System Team  
**反馈**: 遇到问题请更新本文档




