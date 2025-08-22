#!/bin/bash

# Young Interview Expert - 项目设置脚本
# 这个脚本会帮助你快速设置开发环境

set -e

echo "🚀 Young Interview Expert - 项目设置"
echo "======================================"

# 检查 Node.js 版本
echo "📋 检查环境要求..."
node_version=$(node -v | cut -d'v' -f2)
required_version="18.17.0"

if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Node.js 版本过低。需要 >= $required_version，当前版本: $node_version"
    echo "请访问 https://nodejs.org 下载最新版本"
    exit 1
fi

echo "✅ Node.js 版本检查通过: $node_version"

# 检查包管理器
if command -v pnpm &> /dev/null; then
    PACKAGE_MANAGER="pnpm"
    echo "✅ 使用 pnpm 作为包管理器"
elif command -v yarn &> /dev/null; then
    PACKAGE_MANAGER="yarn"
    echo "✅ 使用 yarn 作为包管理器"
elif command -v npm &> /dev/null; then
    PACKAGE_MANAGER="npm"
    echo "✅ 使用 npm 作为包管理器"
else
    echo "❌ 未找到包管理器 (npm/yarn/pnpm)"
    exit 1
fi

# 安装依赖
echo ""
echo "📦 安装项目依赖..."
$PACKAGE_MANAGER install

# 创建环境变量文件
echo ""
echo "⚙️  设置环境变量..."
if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo "✅ 已创建 .env.local 文件"
        echo "⚠️  请编辑 .env.local 文件，填入你的 Supabase 配置"
    else
        echo "❌ 未找到 .env.example 文件"
    fi
else
    echo "✅ .env.local 文件已存在"
fi

# 设置 Git hooks
echo ""
echo "🔧 设置 Git hooks..."
if [ -f "package.json" ] && grep -q "husky" package.json; then
    $PACKAGE_MANAGER run prepare
    echo "✅ Git hooks 设置完成"
fi

echo ""
echo "🎉 项目设置完成！"
echo ""
echo "接下来的步骤："
echo "1. 编辑 .env.local 文件，填入你的 Supabase 配置"
echo "2. 在 Supabase 控制台运行 supabase_migration.sql"
echo "3. 运行 '$PACKAGE_MANAGER dev' 启动开发服务器"
echo ""
echo "📚 更多信息请查看 README.md"
