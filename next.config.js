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
  // 禁用图像优化以避免潜在问题
  images: {
    unoptimized: true,
  },
  // 确保react-icons包被正确处理
  transpilePackages: ['react-icons'],
};

module.exports = nextConfig; 