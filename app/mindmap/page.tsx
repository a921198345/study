'use client'

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import '../../styles/mind-elixir.css';
import ErrorBoundary from '../../components/error-boundary';

// 动态导入组件以避免SSR问题
const MindElixirMap = dynamic(() => import('../../components/MindElixirMap'), { ssr: false });

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
  // 记录数据以便调试
  console.log('服务器返回的原始数据类型:', typeof data);
  
  if (typeof data === 'object' && data !== null) {
    console.log('服务器返回的数据顶层键:', Object.keys(data));
  }
  
  // 检查数据是否为undefined或null
  if (!data) {
    console.warn('数据为undefined或null，使用默认数据');
    return DEFAULT_MINDMAP_DATA;
  }
  
  // 检查数据是否为有效对象
  if (typeof data !== 'object') {
    console.warn('非对象数据:', data);
    return DEFAULT_MINDMAP_DATA;
  }
  
  // 处理可能包含undefined值的数据
  let cleanedData;
  try {
    // 创建深拷贝并移除所有undefined值
    cleanedData = JSON.parse(JSON.stringify(data, (_, v) => v === undefined ? null : v));
  } catch(err) {
    console.error('数据清理过程发生错误:', err);
    console.warn('使用默认数据');
    return DEFAULT_MINDMAP_DATA;
  }
  
  // 如果数据已经包含nodeData字段(符合MindElixir格式)
  if (cleanedData.nodeData && typeof cleanedData.nodeData === 'object') {
    console.log('检测到nodeData格式:', 
      cleanedData.nodeData.id, 
      cleanedData.nodeData.topic?.substring(0, 20)
    );
    
    // 确保nodeData有基本的结构
    if (!cleanedData.nodeData.id || !cleanedData.nodeData.topic) {
      console.warn('nodeData结构不完整，尝试修复');
      
      // 尝试修复数据
      if (!cleanedData.nodeData.id) {
        cleanedData.nodeData.id = 'root';
      }
      
      if (!cleanedData.nodeData.topic) {
        cleanedData.nodeData.topic = '思维导图';
      }
    }
    
    // 确保children是数组
    if (!cleanedData.nodeData.children) {
      cleanedData.nodeData.children = [];
    } else if (!Array.isArray(cleanedData.nodeData.children)) {
      cleanedData.nodeData.children = [];
    }
    
    return cleanedData;
  }
  
  // 如果数据是单节点格式(有id和topic)
  if (cleanedData.id && cleanedData.topic) {
    console.log('检测到单节点格式:', cleanedData.id, cleanedData.topic?.substring(0, 20));
    return {
      nodeData: {
        ...cleanedData,
        expanded: cleanedData.expanded !== undefined ? cleanedData.expanded : true
      }
    };
  }
  
  // 如果数据包含tree字段（某些OPML转换结果）
  if (cleanedData.tree && Array.isArray(cleanedData.tree) && cleanedData.tree.length > 0) {
    console.log('检测到tree格式数据');
    const rootNode = cleanedData.tree[0];
    return {
      nodeData: {
        id: rootNode.id || 'root',
        topic: rootNode.topic || rootNode.title || '思维导图',
        expanded: true,
        children: rootNode.children || []
      }
    };
  }
  
  // 尝试识别数据中的任何可用信息
  console.warn('不支持的数据格式，尝试从内容中提取有用信息');
  
  // 最后的尝试：查找任何可以作为根节点的属性
  const possibleTopics = ['topic', 'title', 'text', 'name', 'label'];
  let rootTopic = '思维导图';
  
  for (const key of possibleTopics) {
    if (typeof cleanedData[key] === 'string' && cleanedData[key].trim() !== '') {
      rootTopic = cleanedData[key];
      break;
    }
  }
  
  // 尝试找到可能的子节点
  let children: any[] = [];
  const possibleChildrenKeys = ['children', 'nodes', 'items', 'elements', 'branches'];
  
  for (const key of possibleChildrenKeys) {
    if (Array.isArray(cleanedData[key]) && cleanedData[key].length > 0) {
      children = cleanedData[key].map((child: any, index: number) => ({
        id: child.id || `node-${index}`,
        topic: child.topic || child.title || child.text || '子节点',
        expanded: true
      }));
      break;
    }
  }
  
  const recoveredData = {
    nodeData: {
      id: cleanedData.id || 'root',
      topic: rootTopic,
      expanded: true,
      children
    }
  };
  
  console.log('从不支持的格式中恢复出的数据:', 
    JSON.stringify(recoveredData).substring(0, 100) + '...'
  );
  
  return recoveredData;
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
    
    const fetchData = async () => {
      try {
        console.log('开始从API获取思维导图数据...');
        const res = await fetch('/api/mindmap-data', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!res.ok) {
          throw new Error(`加载思维导图失败: ${res.status} ${res.statusText}`);
        }
        
        // 日志记录响应头信息
        console.log('API响应状态:', res.status);
        console.log('API响应Content-Type:', res.headers.get('content-type'));
        
        // 处理不同响应类型
        const contentType = res.headers.get('content-type') || '';
        let data;
        
        if (contentType.includes('application/json')) {
          // JSON响应
          try {
            data = await res.json();
            console.log('成功解析JSON响应');
          } catch (jsonError) {
            console.error('JSON解析失败:', jsonError);
            throw new Error(`JSON解析失败: ${jsonError instanceof Error ? jsonError.message : '未知错误'}`);
          }
        } else {
          // 非JSON响应，可能是文本
          try {
            const textContent = await res.text();
            console.warn('非JSON响应，尝试将文本解析为JSON:', textContent.substring(0, 100) + '...');
            
            // 尝试将文本内容解析为JSON
            try {
              data = JSON.parse(textContent);
              console.log('成功将文本内容解析为JSON');
            } catch (parseErr) {
              console.error('无法将文本内容解析为JSON:', parseErr);
              throw new Error(`非JSON响应: ${contentType}`);
            }
          } catch (textError) {
            console.error('读取响应内容失败:', textError);
            throw new Error(`读取响应失败: ${textError instanceof Error ? textError.message : '未知错误'}`);
          }
        }
        
        console.log('API返回的原始数据类型:', typeof data);
        
        // 验证并转换数据
        const validData = validateAndTransform(data);
        console.log('验证后的数据结构:', Object.keys(validData));
        
        if (validData.nodeData) {
          console.log('nodeData.id:', validData.nodeData.id);
          console.log('nodeData.topic:', validData.nodeData.topic?.substring(0, 30));
          console.log('children数量:', Array.isArray(validData.nodeData.children) ? validData.nodeData.children.length : '非数组');
        }
        
        setMindMapData(validData);
        setError(null);
      } catch (err) {
        console.error('加载思维导图出错:', err);
        setError(err instanceof Error ? err.message : '加载思维导图时发生错误');
        // 出错时使用默认数据
        setMindMapData(DEFAULT_MINDMAP_DATA);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
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