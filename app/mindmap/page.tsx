'use client'

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import '@/styles/mind-elixir.css';
import ErrorBoundary from '@/components/error-boundary';

// 动态导入组件以避免SSR问题
const MindElixirMap = dynamic(() => import('@/components/MindElixirMap'), { ssr: false });

export default function MindMapPage() {
  const [mindMapData, setMindMapData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'right' | 'side'>('right');
  const [theme, setTheme] = useState<'primary' | 'dark' | 'green' | 'purple'>('primary');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 从API加载思维导图数据
  useEffect(() => {
    setLoading(true);
    fetch('/api/mindmap-data')
      .then(res => {
        if (!res.ok) {
          throw new Error(`加载思维导图失败: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        setMindMapData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('加载思维导图出错:', err);
        setError(err.message || '加载思维导图时发生错误');
        setLoading(false);
      });
  }, []);

  // 切换视图模式
  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'right' ? 'side' : 'right');
  };

  // 切换主题
  const changeTheme = (newTheme: 'primary' | 'dark' | 'green' | 'purple') => {
    setTheme(newTheme);
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-6 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">思维导图</h1>

        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 border border-red-300 bg-red-50 text-red-700 rounded">
            <p className="font-bold">加载失败</p>
            <p>{error}</p>
          </div>
        ) : mindMapData ? (
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <button 
                onClick={toggleViewMode} 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                {viewMode === 'right' ? '切换到居中布局' : '切换到右侧布局'}
              </button>
              
              <button 
                onClick={() => changeTheme('primary')} 
                className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition ${theme === 'primary' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
              >
                默认主题
              </button>
              
              <button 
                onClick={() => changeTheme('dark')} 
                className={`px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition ${theme === 'dark' ? 'ring-2 ring-offset-2 ring-gray-700' : ''}`}
              >
                深色主题
              </button>
              
              <button 
                onClick={() => changeTheme('green')} 
                className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition ${theme === 'green' ? 'ring-2 ring-offset-2 ring-green-600' : ''}`}
              >
                绿色主题
              </button>
              
              <button 
                onClick={() => changeTheme('purple')} 
                className={`px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition ${theme === 'purple' ? 'ring-2 ring-offset-2 ring-purple-600' : ''}`}
              >
                紫色主题
              </button>
            </div>

            <div className="min-h-[600px] border rounded-lg overflow-hidden">
              <MindElixirMap 
                data={mindMapData} 
                direction={viewMode}
                draggable={true}
                editable={false}
                contextMenu={false}
                theme={theme}
                height="600px"
                width="100%"
                className="bg-white"
              />
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              <p>操作说明：</p>
              <ul className="list-disc pl-5">
                <li>鼠标滚轮：缩放思维导图</li>
                <li>按住鼠标左键：拖动整个思维导图</li>
                <li>点击节点：选择节点</li>
                <li>双击节点：折叠/展开节点</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p className="text-lg">未找到思维导图数据</p>
            <p className="text-sm mt-2">请联系管理员确认思维导图数据是否已上传</p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
} 