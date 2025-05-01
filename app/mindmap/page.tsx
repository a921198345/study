'use client'

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import '@/styles/mind-elixir.css';

// 动态导入组件以避免SSR问题
const OpmlUploader = dynamic(() => import('@/components/OpmlUploader'), { ssr: false });
const MindElixirMap = dynamic(() => import('@/components/MindElixirMap'), { ssr: false });

// 创建样式类
const tabStyles = {
  active: "bg-blue-500 text-white",
  inactive: "bg-white text-gray-800 hover:bg-gray-100",
  base: "px-4 py-2 rounded-t-lg font-medium transition-colors"
};

export default function MindMapPage() {
  const [activeTab, setActiveTab] = useState('upload');
  const [mindMapData, setMindMapData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'right' | 'side'>('right');
  const [theme, setTheme] = useState<'primary' | 'dark' | 'green' | 'purple'>('primary');
  
  // 处理OPML上传结果
  const handleUploadResult = (result: any) => {
    if (result && result.success && result.tree) {
      setMindMapData(result.tree);
      // 自动切换到思维导图查看页面
      setActiveTab('view');
    }
  };

  // 切换视图模式
  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'right' ? 'side' : 'right');
  };

  // 切换主题
  const changeTheme = (newTheme: 'primary' | 'dark' | 'green' | 'purple') => {
    setTheme(newTheme);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">思维导图管理</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex mb-6">
          <TabsTrigger value="upload" className="flex-1">
            上传思维导图
          </TabsTrigger>
          <TabsTrigger value="view" className="flex-1">
            查看思维导图
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="p-4 bg-white rounded-lg shadow">
          <OpmlUploader onUploadResult={handleUploadResult} />
        </TabsContent>

        <TabsContent value="view" className="p-4 bg-white rounded-lg shadow">
          {mindMapData ? (
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
              <p className="text-lg">尚未上传思维导图</p>
              <p className="text-sm mt-2">请先在"上传思维导图"标签页上传OPML文件</p>
              <button 
                onClick={() => setActiveTab('upload')} 
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                前往上传
              </button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 