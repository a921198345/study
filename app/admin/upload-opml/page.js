'use client'

import OpmlUploader from '../../../components/OpmlUploader';
import Link from 'next/link';
import { useState } from 'react';

export default function OpmlUploadPage() {
  return (
    <div className="bg-gray-900 min-h-screen text-white p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">思维导图上传与处理</h1>
          <p className="text-gray-400">上传OPML格式的思维导图并转换为知识树结构</p>
          
          <div className="mt-4 flex space-x-4">
            <Link 
              href="/admin/upload" 
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              « 返回PDF上传页面
            </Link>
            <Link 
              href="/" 
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              « 返回首页
            </Link>
          </div>
        </header>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="md:col-span-1">
            <OpmlUploader />
            
            <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="text-xl font-semibold mb-3">上传说明</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>1. 选择OPML格式的思维导图文件</li>
                <li>2. 点击"上传并处理"按钮</li>
                <li>3. 等待系统处理文件（处理进度会实时显示）</li>
                <li>4. 查看处理结果，可下载转换后的知识树JSON文件</li>
              </ul>
              
              <div className="mt-4 p-3 bg-blue-900 bg-opacity-50 rounded text-sm border border-blue-800">
                <h4 className="font-medium text-blue-300 mb-1">文件要求</h4>
                <p className="text-gray-300">
                  支持标准OPML格式文件，如XMind、MindNode、OmniOutliner等导出的文件。
                  确保OPML文件结构清晰，以便系统正确识别层级关系。
                </p>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-1">
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 h-full">
              <h3 className="text-xl font-semibold mb-3">思维导图处理说明</h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium text-green-400 mb-1">OPML格式优势</h4>
                  <p className="text-gray-300">
                    思维导图OPML格式相比PDF更易于解析，能够精确保留节点层级关系，
                    不存在PDF解析时容易出现的格式丢失和结构混乱问题。
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-green-400 mb-1">处理流程</h4>
                  <ol className="list-decimal pl-5 text-gray-300 space-y-1">
                    <li>上传OPML文件到服务器</li>
                    <li>解析XML结构，提取节点关系</li>
                    <li>构建知识树结构，保留层级关系</li>
                    <li>生成标准化的知识树JSON文件</li>
                    <li>提供数据下载和预览功能</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium text-green-400 mb-1">使用建议</h4>
                  <ul className="list-disc pl-5 text-gray-300 space-y-1">
                    <li>使用专业思维导图软件创建结构化内容</li>
                    <li>导出为标准OPML格式</li>
                    <li>确保节点层级清晰，命名规范</li>
                    <li>对于复杂内容，建议分多个OPML文件上传</li>
                  </ul>
                </div>
                
                <div className="p-3 bg-gray-900 rounded border border-yellow-800">
                  <h4 className="font-medium text-yellow-400 mb-1">常见问题</h4>
                  <div className="text-gray-300">
                    <p><span className="text-yellow-500">问题：</span> 上传失败？</p>
                    <p><span className="text-blue-400">解答：</span> 确保文件是有效的OPML/XML格式，不超过10MB。</p>
                    
                    <p className="mt-2"><span className="text-yellow-500">问题：</span> 无法识别结构？</p>
                    <p><span className="text-blue-400">解答：</span> 检查OPML是否符合标准格式，包含正确的outline元素。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 