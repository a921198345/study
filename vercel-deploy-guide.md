# Vercel部署指南

## 直接部署（推荐）

1. 访问 [Vercel控制台](https://vercel.com/cuiges-projects/study)
2. 点击 "Import Project" 或 "New Deployment"
3. 选择GitHub仓库: `a921198345/study`
4. 使用以下配置：
   - Framework: Next.js
   - Node.js版本: 18.x (已在package.json中指定)
   - 构建命令: `npm run build`
   - 输出目录: `.next`
   - 环境变量配置 (如需):
     ```
     NODE_ENV=production
     ```

## 常见问题排查

如果依然遇到构建问题，尝试以下方法：

1. 在Vercel项目设置中明确设置Node.js版本为18.x
2. 确保项目使用正确的.env.production文件
3. 禁用自动GitHub集成部署，使用手动部署

## 本地验证应用正常

访问以下本地路径验证功能：
- http://localhost:3000/mindmap (用户查看页面)
- http://localhost:3000/admin/mindmap-management (管理页面)

## 已修复的问题

1. PostCSS配置 - 使用postcss-nested替代tailwindcss/nesting
2. 移除了Next.js字体加载以避免字体相关构建错误
3. 明确锁定Node.js版本为18.x 