'use client'

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import '../../styles/mind-elixir.css';
import ErrorBoundary from '../../components/error-boundary';

// 动态导入组件以避免SSR问题
const MindElixirMap = dynamic(() => import('@/components/MindElixirMap'), { ssr: false });

// 默认思维导图数据 - 即使API无法获取数据也能显示
const DEFAULT_MINDMAP_DATA = {
  nodeData: {
    id: 'root',
    topic: '默认思维导图',
    expanded: true,
    children: [
      {
        id: 'default-1',
        topic: '请上传思维导图数据',
        expanded: true
      }
    ]
  }
};

// 验证并转换API返回的数据
const validateAndTransform = (data: any) => {
  if (!data) return DEFAULT_MINDMAP_DATA;
  
  // 检查数据是否为有效对象
  if (typeof data !== 'object') {
    console.warn('非对象数据:', data);
    return DEFAULT_MINDMAP_DATA;
  }
  
  // 如果数据已经包含nodeData字段(符合MindElixir格式)
  if (data.nodeData && typeof data.nodeData === 'object') {
    return data;
  }
  
  // 如果数据是单节点格式(有id和topic)
  if (data.id && data.topic) {
    return {
      nodeData: {
        ...data,
        expanded: data.expanded !== undefined ? data.expanded : true
      }
    };
  }
  
  // 返回默认数据
  console.warn('不支持的数据格式:', data);
  return DEFAULT_MINDMAP_DATA;
};

export default function MindMapPage() {
  const [mindMapData, setMindMapData] = useState<any>(DEFAULT_MINDMAP_DATA);
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
        console.log('API返回的原始数据:', data);
        // 验证并转换数据
        const validData = validateAndTransform(data);
        console.log('验证后的数据:', validData);
        setMindMapData(validData);
        setLoading(false);
      })
      .catch(err => {
        console.error('加载思维导图出错:', err);
        setError(err.message || '加载思维导图时发生错误');
        // 出错时使用默认数据
        setMindMapData(DEFAULT_MINDMAP_DATA);
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">思维导图</h1>
      
      <div className="flex flex-wrap gap-2 mb-4">
          <button 
          onClick={toggleViewMode}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
          {viewMode === 'right' ? '切换到居中布局' : '切换到居右布局'}
          </button>
        
          <button 
          onClick={() => changeTheme('primary')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
          默认主题
          </button>
        
          <button 
          onClick={() => changeTheme('dark')}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition"
          >
          深色主题
          </button>
        
          <button 
          onClick={() => changeTheme('green')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
          >
          绿色主题
          </button>
        
          <button
          onClick={() => changeTheme('purple')}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
          >
          紫色主题
          </button>
      </div>
      
      <div className="border rounded-lg overflow-hidden" style={{ height: '75vh' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full bg-red-50 p-4">
            <div className="text-red-500">{error}</div>
          </div>
        ) : (
          <ErrorBoundary fallback={<div className="p-4 text-red-500">思维导图渲染错误</div>}>
            <MindElixirMap 
              data={mindMapData} 
              direction={viewMode}
              draggable={true}
              editable={false}
              contextMenu={false}
              theme={theme}
              height="100%"
              width="100%"
            />
          </ErrorBoundary>
        )}
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>操作说明：</p>
        <ul className="list-disc pl-5">
          <li>鼠标滚轮：缩放思维导图</li>
          <li>按住鼠标左键：拖动思维导图</li>
          <li>点击节点：展开/折叠子节点</li>
        </ul>
      </div>
    </div>
  );
} 