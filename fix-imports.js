const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

async function* walk(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* walk(res);
    } else {
      yield res;
    }
  }
}

async function getRelativePath(filePath, importPath) {
  // 计算从文件到项目根目录的相对路径
  const fileDir = path.dirname(filePath);
  const projectRoot = path.resolve('.');
  
  if (importPath.startsWith('@/')) {
    const relativePath = path.relative(fileDir, projectRoot);
    let newImportPath = path.join(relativePath || '.', importPath.slice(2));
    
    // 确保路径格式正确（使用/分隔符）
    newImportPath = newImportPath.replace(/\\/g, '/');
    
    // 如果没有./开头，需要添加
    if (!newImportPath.startsWith('.')) {
      newImportPath = './' + newImportPath;
    }
    
    return newImportPath;
  }
  
  return importPath;
}

async function fixImports(filePath) {
  if (!filePath.match(/\.(tsx|ts|js|jsx)$/)) return false;
  
  const content = await readFile(filePath, 'utf-8');
  
  // 查找所有的import语句
  const importRegex = /import(?:["'\s]*([\w*{}\n\r\t, ]+)from\s*)?["'\s]*(@\/[^"'\s]+)["'\s]*/g;
  
  let newContent = content;
  let match;
  let changed = false;
  
  // 收集所有需要替换的导入路径
  const replacements = [];
  while ((match = importRegex.exec(content)) !== null) {
    const importStatement = match[0];
    const importPath = match[2];
    
    const newImportPath = await getRelativePath(filePath, importPath);
    
    if (newImportPath !== importPath) {
      const newImportStatement = importStatement.replace(importPath, newImportPath);
      replacements.push({
        oldStatement: importStatement,
        newStatement: newImportStatement
      });
    }
  }
  
  // 应用替换
  for (const replacement of replacements) {
    newContent = newContent.replace(replacement.oldStatement, replacement.newStatement);
    changed = true;
  }
  
  if (changed) {
    await writeFile(filePath, newContent, 'utf-8');
    console.log(`Fixed imports in ${filePath}`);
    return true;
  }
  
  return false;
}

async function main() {
  const appDir = path.join('.', 'app');
  let fixedCount = 0;
  
  for await (const filePath of walk(appDir)) {
    try {
      const fixed = await fixImports(filePath);
      if (fixed) fixedCount++;
    } catch (err) {
      console.error(`Error processing ${filePath}:`, err);
    }
  }
  
  console.log(`Fixed imports in ${fixedCount} files.`);
}

main().catch(console.error); 