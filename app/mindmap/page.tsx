'use client'

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ImSpinner2 } from 'react-icons/im';
import { IoSunnyOutline, IoMoonOutline } from 'react-icons/io5';
import { MdViewComfy, MdViewDay } from 'react-icons/md';
import "./mindmap.css";
import ErrorBoundary from '../../components/error-boundary';

// 动态导入ReactFlow组件以避免服务端渲染问题
const ReactFlowMap = dynamic(() => import('../../components/ReactFlowMap'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-[600px]">
      <ImSpinner2 className="animate-spin text-4xl text-gray-600" />
    </div>
  ),
});

// 默认思维导图数据
const DEFAULT_MINDMAP_DATA = {
  nodeData: {
    id: 'root',
    topic: '请上传思维导图数据',
    expanded: true,
    children: [
      {
        id: 'sub1',
        topic: '您可以选择导入一个JSON文件',
        expanded: true,
      },
      {
        id: 'sub2',
        topic: '或者从API获取思维导图数据',
        expanded: true,
      }
    ]
  }
};

// 验证并转换API响应数据为思维导图数据格式
function validateAndTransform(data: any) {
  console.log('验证并转换API响应数据', data);
  
  // 如果数据为空，使用默认数据
  if (!data) {
    console.log('数据为空，使用默认思维导图数据');
    return DEFAULT_MINDMAP_DATA;
  }
  
  try {
    // 如果数据是字符串，尝试解析为JSON
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
        console.log('将字符串解析为JSON', data);
      } catch (error) {
        console.error('解析JSON字符串失败', error);
        return DEFAULT_MINDMAP_DATA;
      }
    }
    
    // 处理nodeData格式
    if (data.nodeData && typeof data.nodeData === 'object') {
      console.log('检测到nodeData格式');
      return data;
    }
    
    // 处理直接包含id和topic的格式
    if (data.id && data.topic) {
      console.log('检测到id/topic直接格式，转换为nodeData格式');
      return {
        nodeData: data
      };
    }
    
    // 处理仅包含topic的格式
    if (data.topic) {
      console.log('检测到仅包含topic的格式，添加id并转换为nodeData格式');
      return {
        nodeData: {
          ...data,
          id: data.id || 'root'
        }
      };
    }
    
    // 处理未知格式
    console.warn('未知数据格式，使用默认思维导图数据', data);
    return DEFAULT_MINDMAP_DATA;
  } catch (error) {
    console.error('验证和转换数据时出错', error);
    return DEFAULT_MINDMAP_DATA;
  }
}

// 思维导图页面组件
export default function MindMapPage() {
  const [data, setData] = useState(DEFAULT_MINDMAP_DATA);
  const [viewMode, setViewMode] = useState<'right' | 'side'>('right');
  const [theme, setTheme] = useState<'primary' | 'dark' | 'green' | 'purple'>('primary');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 获取思维导图数据
  useEffect(() => {
    const fetchMindMapData = async () => {
      try {
        console.log('获取思维导图数据...');
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/mindmap-data');
        
        if (!response.ok) {
          throw new Error(`API响应错误: ${response.status} ${response.statusText}`);
        }
        
        let apiData;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          apiData = await response.json();
          console.log('获取到JSON数据', apiData);
        } else {
          // 非JSON响应
          const text = await response.text();
          console.log('获取到非JSON数据', text.substring(0, 100));
          // 尝试作为JSON解析
          try {
            apiData = JSON.parse(text);
          } catch (e) {
            console.error('解析非JSON响应失败', e);
            apiData = text;
          }
        }
        
        // 验证并转换数据
        const transformedData = validateAndTransform(apiData);
        console.log('转换后的思维导图数据', transformedData);
        
        setData(transformedData);
        setLoading(false);
      } catch (error) {
        console.error('获取思维导图数据失败', error);
        setError('获取思维导图数据失败。请检查API或网络连接。');
        setLoading(false);
      }
    };
    
    fetchMindMapData();
  }, []);
  
  // 切换视图模式
  const toggleViewMode = () => {
    console.log(`切换视图模式: ${viewMode} -> ${viewMode === 'right' ? 'side' : 'right'}`);
    setViewMode(viewMode === 'right' ? 'side' : 'right');
  };
  
  // 切换主题
  const toggleTheme = () => {
    const themes: Array<'primary' | 'dark' | 'green' | 'purple'> = ['primary', 'dark', 'green', 'purple'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    console.log(`切换主题: ${theme} -> ${nextTheme}`);
    setTheme(nextTheme);
  };
  
  return (
    <div className="flex flex-col w-full h-screen overflow-hidden">
      {/* 工具栏 */}
      <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 border-b">
        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          AI考试助手 - 思维导图
        </div>
        <div className="flex gap-3">
          {/* 视图模式切换按钮 */}
          <button
            onClick={toggleViewMode}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors z-10"
            title={viewMode === 'right' ? '切换到中心布局' : '切换到右侧布局'}
          >
            {viewMode === 'right' ? (
              <MdViewDay size={24} className="text-gray-600 dark:text-gray-300" />
            ) : (
              <MdViewComfy size={24} className="text-gray-600 dark:text-gray-300" />
            )}
          </button>
          
          {/* 主题切换按钮 */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors z-10"
            title="切换主题"
          >
            {theme === 'dark' ? (
              <IoSunnyOutline size={24} className="text-gray-600 dark:text-gray-300" />
            ) : (
              <IoMoonOutline size={24} className="text-gray-600 dark:text-gray-300" />
            )}
          </button>
        </div>
      </div>
      
      {/* 思维导图 */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <ImSpinner2 className="animate-spin text-4xl text-gray-600" />
            <span className="ml-2 text-gray-600">加载思维导图...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col justify-center items-center h-full">
            <div className="text-red-500 text-xl mb-2">{error}</div>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              重新加载
            </button>
          </div>
        ) : (
          <ErrorBoundary>
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden" style={{ height: '80vh' }}>
              <ReactFlowMap
                data={data}
                direction={viewMode}
                theme={theme}
                draggable={true}
                editable={false}
                contextMenu={false}
                height="100%"
                width="100%"
              />
            </div>
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
} 