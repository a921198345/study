/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 解决环境变量问题
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    DEEPSEEK_API_URL: process.env.DEEPSEEK_API_URL,
    DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL,
    NEXT_PUBLIC_FEATURE_AI_CHAT: process.env.NEXT_PUBLIC_FEATURE_AI_CHAT,
    NEXT_PUBLIC_FEATURE_USER_AUTH: process.env.NEXT_PUBLIC_FEATURE_USER_AUTH,
  },
  // 提高构建性能
  poweredByHeader: false,
  // 禁用图像优化以避免潜在问题
  images: {
    unoptimized: true,
  },
  // 确保react-icons包被正确处理
  transpilePackages: ['react-icons'],
  // 增加对Vercel部署的兼容性
  webpack: (config) => {
    // 确保模块能够正确解析
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    
    return config;
  },
  // 使用静态HTML导出
  output: 'export',
  // 禁用服务器组件以支持静态导出
  experimental: {
    appDir: true
  },
  // 避免动态API路由错误
  distDir: 'out',
};

module.exports = nextConfig; 