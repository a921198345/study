/**
 * 知识库上传与搜索集成测试脚本
 * 
 * 此脚本将执行以下操作：
 * 1. 上传示例民法基础知识文件到知识库
 * 2. 执行搜索测试以验证上传内容是否可被检索
 * 3. 显示测试结果
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 检查环境变量
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('错误: 缺少Supabase配置。请确保.env.local文件中包含NEXT_PUBLIC_SUPABASE_URL和SUPABASE_SERVICE_KEY或NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('=== 知识库上传与搜索集成测试 ===\n');

// 定义示例文件路径
const sampleFilePath = path.join(process.cwd(), 'data', '民法基础知识.txt');

// 检查示例文件是否存在
if (!fs.existsSync(sampleFilePath)) {
  console.error(`错误: 示例文件不存在 - ${sampleFilePath}`);
  console.log('请确保data目录下有民法基础知识.txt文件');
  process.exit(1);
}

// 定义测试查询内容
const testQueries = [
  '民法的基本原则',
  '自然人的民事行为能力',
  '代理制度',
  '诉讼时效'
];

// 执行上传测试
console.log('第1步: 上传示例文件到知识库\n');
try {
  console.log(`上传文件: ${sampleFilePath}`);
  execSync(`node scripts/upload-file-to-knowledge.js --file "${sampleFilePath}" --subject 法律`, { 
    stdio: 'inherit' 
  });
  console.log('\n文件上传完成\n');
} catch (error) {
  console.error('上传文件时发生错误:', error.message);
  process.exit(1);
}

// 执行搜索测试
console.log('第2步: 测试知识库搜索功能\n');

let passedTests = 0;
for (const query of testQueries) {
  console.log(`测试查询: "${query}"`);
  try {
    // 执行搜索命令并捕获输出
    const searchOutput = execSync(`node scripts/test-knowledge-search.js --query "${query}"`, { 
      encoding: 'utf-8' 
    });
    
    // 判断测试是否通过
    if (searchOutput.includes('未找到相关知识点')) {
      console.log('❌ 测试失败: 未找到相关知识点\n');
    } else {
      passedTests++;
      console.log('✅ 测试通过: 成功找到相关知识点\n');
    }
  } catch (error) {
    console.error(`执行查询时出错: ${error.message}`);
  }
}

// 显示测试结果总结
console.log('=== 测试结果总结 ===');
console.log(`共测试: ${testQueries.length} 个查询`);
console.log(`通过: ${passedTests} 个`);
console.log(`失败: ${testQueries.length - passedTests} 个`);

if (passedTests === testQueries.length) {
  console.log('\n🎉 恭喜! 所有测试均已通过，知识库功能运行正常。');
} else {
  console.log('\n⚠️ 部分测试未通过，请检查知识库和搜索功能。');
} 