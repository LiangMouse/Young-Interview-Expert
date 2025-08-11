import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用更详细的错误信息
  productionBrowserSourceMaps: true,

  // Webpack 配置
  webpack: (config, { dev }) => {
    if (dev) {
      // 开发环境下禁用压缩
      config.optimization.minimize = false;

      // 启用更好的调试信息 - 这会生成完整的 source maps
      config.devtool = "eval-source-map";
    }

    return config;
  },

  // 实验性功能
  experimental: {
    // 启用更好的错误堆栈跟踪
    optimizePackageImports: ["@supabase/supabase-js"],
  },
};

export default nextConfig;
