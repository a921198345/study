'use client'

import { useState, useEffect } from 'react';
import PdfUploader from '../../../components/PdfUploader';
import ProcessingStatus from '../../../components/ProcessingStatus';
import Link from 'next/link';

export default function UploadPage() {
  // 强制应用样式
  useEffect(() => {
    // 添加内联样式覆盖原有样式
    const style = document.createElement('style');
    style.textContent = `
      body { 
        background-color: #111827 !important; 
        color: #e5e7eb !important; 
      }
      .dark-mode-fix {
        background-color: #1f2937 !important;
        border-color: #374151 !important;
        color: #f3f4f6 !important;
      }
      .dark-mode-button {
        background-color: #3b82f6 !important;
        color: white !important;
      }
      .dark-mode-input {
        background-color: #374151 !important;
        color: #f3f4f6 !important;
        border-color: #4b5563 !important;
      }
      .dark-mode-heading {
        color: white !important;
      }
      .dark-mode-text {
        color: #d1d5db !important;
      }
    `;
    document.head.appendChild(style);
    
    // 强制刷新组件
    const refreshInterval = setInterval(() => {
      const elements = document.querySelectorAll('.force-refresh');
      elements.forEach(el => {
        // 触发布局重绘
        el.style.opacity = '0.99';
        setTimeout(() => {
          el.style.opacity = '1';
        }, 50);
      });
    }, 1000);
    
    return () => {
      document.head.removeChild(style);
      clearInterval(refreshInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 force-refresh">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center text-white dark-mode-heading">知识树 PDF 上传管理</h1>
        
        <div className="text-center mb-6">
          <Link 
            href="/admin/upload-opml" 
            className="inline-block py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            切换到OPML思维导图上传 »
          </Link>
          <p className="text-gray-400 mt-2 text-sm">OPML格式的思维导图可以更准确地保留知识结构</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* 左侧：上传组件 */}
          <div>
            <PdfUploader />
            
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4 text-white dark-mode-heading">上传说明</h2>
              <div className="bg-gray-800 border-l-4 border-yellow-500 p-4 text-gray-200 rounded shadow-md dark-mode-fix">
                <p className="mb-2 flex items-center">
                  <span className="inline-block w-6 h-6 rounded-full bg-yellow-500 text-gray-900 text-center mr-2 font-bold">1</span>
                  <span className="dark-mode-text">请上传法考知识树PDF文件</span>
                </p>
                <p className="mb-2 flex items-center">
                  <span className="inline-block w-6 h-6 rounded-full bg-yellow-500 text-gray-900 text-center mr-2 font-bold">2</span>
                  <span className="dark-mode-text">系统会自动提取结构化的知识点</span>
                </p>
                <p className="mb-2 flex items-center">
                  <span className="inline-block w-6 h-6 rounded-full bg-yellow-500 text-gray-900 text-center mr-2 font-bold">3</span>
                  <span className="dark-mode-text">处理完成后，知识点将导入到系统数据库</span>
                </p>
                <p className="flex items-center">
                  <span className="inline-block w-6 h-6 rounded-full bg-yellow-500 text-gray-900 text-center mr-2 font-bold">4</span>
                  <span className="dark-mode-text">文件处理可能需要几分钟，请耐心等待</span>
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-3 bg-blue-900 bg-opacity-40 rounded-lg border border-blue-800">
              <h3 className="font-medium text-blue-300 mb-2">提示：思维导图更优选择</h3>
              <p className="text-sm text-gray-300">
                如果您有思维导图格式的学习资料，推荐使用
                <Link href="/admin/upload-opml" className="text-blue-400 underline mx-1 hover:text-blue-300">
                  OPML上传
                </Link>
                功能，可以更精确地保留知识结构。
              </p>
            </div>
          </div>
          
          {/* 右侧：处理状态 */}
          <div>
            <ProcessingStatus />
          </div>
        </div>
      </div>
    </div>
  );
} 