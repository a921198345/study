const fs = require('fs');
const path = require('path');
const { PDFExtract } = require('pdf.js-extract');

// 获取项目根目录
const PROJECT_ROOT = path.resolve(__dirname, '..');

// 日志功能
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// 指定要测试的PDF文件路径
const pdfDir = path.join(PROJECT_ROOT, 'data', 'pdfs');
const files = fs.readdirSync(pdfDir).filter(file => file.endsWith('.pdf'));

if (files.length === 0) {
  log('未找到PDF文件');
  process.exit(1);
}

// 选择最新的PDF文件进行测试
const latestPdf = files.sort((a, b) => {
  return fs.statSync(path.join(pdfDir, b)).mtime.getTime() - 
         fs.statSync(path.join(pdfDir, a)).mtime.getTime();
})[0];

const pdfPath = path.join(pdfDir, latestPdf);
log(`开始测试: ${pdfPath}`);

async function testPdfExtract() {
  try {
    log('创建PDFExtract实例');
    const pdfExtract = new PDFExtract();
    
    log('开始提取PDF内容...');
    const result = await pdfExtract.extract(pdfPath, {});
    
    log(`PDF提取成功，共 ${result.pages.length} 页`);
    log(`第一页含有 ${result.pages[0].content.length} 个内容元素`);
    
    // 记录一些内容样本
    if (result.pages[0].content.length > 0) {
      log('内容样本:');
      for (let i = 0; i < Math.min(5, result.pages[0].content.length); i++) {
        log(`  - ${JSON.stringify(result.pages[0].content[i])}`);
      }
    }
    
    // 保存一个简单的文本版本
    let contentText = '';
    for (const page of result.pages) {
      for (const content of page.content) {
        contentText += content.str + ' ';
      }
      contentText += '\n\n--- 页面分隔 ---\n\n';
    }
    
    const txtPath = path.join(
      path.dirname(pdfPath),
      path.basename(pdfPath, '.pdf') + '-test.txt'
    );
    
    fs.writeFileSync(txtPath, contentText);
    log(`已保存测试提取内容至: ${txtPath}`);
    
    log('PDF提取测试完成');
    return true;
  } catch (error) {
    log(`PDF提取失败: ${error.message}`);
    log(error.stack);
    return false;
  }
}

// 执行测试
testPdfExtract().then(success => {
  if (success) {
    log('测试成功');
    process.exit(0);
  } else {
    log('测试失败');
    process.exit(1);
  }
}); 