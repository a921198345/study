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
  // 优化生产构建
  swcMinify: true,
  
  // 提高构建性能
  compiler: {
    // 删除console.log语句
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig; 