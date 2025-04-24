import * as fs from 'fs';
import * as path from 'path';

// 加载.env.local文件中的环境变量
export function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars = envContent.split('\n');
    
    for (const line of envVars) {
      const trimmedLine = line.trim();
      
      // 跳过空行、注释和格式不正确的行
      if (!trimmedLine || trimmedLine.startsWith('#') || !trimmedLine.includes('=')) {
        continue;
      }
      
      // 解析键值对
      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('='); // 处理值中可能包含等号的情况
      
      if (key && value) {
        // 设置环境变量
        process.env[key.trim()] = value.trim().replace(/^["'](.*)["']$/, '$1'); // 移除可能的引号
      }
    }
    
    console.log('已加载.env.local环境变量');
  } else {
    console.warn('警告：找不到.env.local文件');
  }
} 