'use client'

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import '../../styles/mind-elixir.css';
import ErrorBoundary from '../../components/error-boundary';

// 动态导入组件以避免SSR问题
const ReactFlowMap = dynamic(() => import('../../components/ReactFlowMap'), { ssr: false });

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
    // 创建深拷贝并移除所有undefined值和"undefined"字符串
    cleanedData = JSON.parse(JSON.stringify(data, (key, value) => {
      // 处理undefined和"undefined"字符串
      if (value === undefined || value === "undefined") {
        return null;
      }
      return value;
    }));
  } catch(err) {
    console.error('数据清理过程发生错误:', err);
    console.warn('使用默认数据');
    return DEFAULT_MINDMAP_DATA;
  }
  
  // 处理嵌套在数据中的"undefined"字符串
  const sanitizeData = (obj: any): any => {
    if (!obj) return obj;
    
    // 处理基础类型
    if (typeof obj !== 'object') {
      return obj === "undefined" ? null : obj;
    }
    
    // 处理数组
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeData(item));
    }
    
    // 处理对象
    const result: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = obj[key] === "undefined" ? null : sanitizeData(obj[key]);
      }
    }
    return result;
  };
  
  // 对数据进行深度清理
  cleanedData = sanitizeData(cleanedData);
  
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
            const textResponse = await res.text();
            
            // 检查是否包含可能导致解析错误的"undefined"字符串
            if (textResponse.includes('"undefined"')) {
              console.warn('检测到响应中包含"undefined"字符串，尝试替换为null');
              const fixedContent = textResponse.replace(/"undefined"/g, 'null');
              data = JSON.parse(fixedContent);
              console.log('替换后成功解析JSON');
            } else {
              data = JSON.parse(textResponse);
              console.log('成功解析JSON响应');
            }
          } catch (jsonError) {
            console.error('JSON解析失败:', jsonError);
            throw new Error(`JSON解析失败: ${jsonError instanceof Error ? jsonError.message : '未知错误'}`);
          }
        } else {
          // 非JSON响应，可能是文本
          try {
            const textContent = await res.text();
            console.warn('非JSON响应，尝试将文本解析为JSON:', textContent.substring(0, 100) + '...');
            
            // 如果响应是字符串，尝试将其解析为JSON
            if (textContent.trim().startsWith('{') || textContent.trim().startsWith('[')) {
              try {
                data = JSON.parse(textContent);
                console.log('成功将文本响应解析为JSON');
              } catch (parseError) {
                console.error('将文本解析为JSON失败:', parseError);
                throw new Error(`文本解析为JSON失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`);
              }
            } else {
              // 如果不是JSON格式，尝试作为纯文本处理
              console.warn('响应不是JSON格式，按纯文本处理');
              data = { text: textContent };
            }
          } catch (textError) {
            console.error('读取响应文本失败:', textError);
            throw new Error(`读取响应文本失败: ${textError instanceof Error ? textError.message : '未知错误'}`);
          }
        }
        
        // 验证和转换数据
        const transformedData = validateAndTransform(data);
        console.log('数据验证和转换完成，准备更新状态');
        
        // 检查data是否有nodeData属性
        if (!transformedData.nodeData) {
          console.warn('转换后的数据缺少nodeData属性');
        }
        
        // 更新状态
        setMindMapData(transformedData);
        setLoading(false);
      } catch (err) {
        console.error('思维导图数据加载失败:', err);
        setError(`加载思维导图失败: ${err instanceof Error ? err.message : '未知错误'}`);
        // 使用默认数据
        setMindMapData(DEFAULT_MINDMAP_DATA);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // 切换视图模式（右侧布局/中心布局）
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'right' ? 'side' : 'right');
  };
  
  // 更改主题颜色
  const changeTheme = (newTheme: 'primary' | 'dark' | 'green' | 'purple') => {
    setTheme(newTheme);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 标题栏 */}
      <header className="bg-white shadow-sm p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">思维导图</h1>
          
          {/* 主题选择和布局控制 */}
          <div className="flex space-x-2">
            <button
              onClick={() => changeTheme('primary')}
              className={`px-3 py-1 rounded ${theme === 'primary' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              默认主题
            </button>
            <button
              onClick={() => changeTheme('dark')}
              className={`px-3 py-1 rounded ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              深色主题
            </button>
            <button
              onClick={() => changeTheme('green')}
              className={`px-3 py-1 rounded ${theme === 'green' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              绿色主题
            </button>
            <button
              onClick={() => changeTheme('purple')}
              className={`px-3 py-1 rounded ${theme === 'purple' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              紫色主题
            </button>
            <button
              onClick={toggleViewMode}
              className="px-3 py-1 bg-gray-700 text-white rounded"
            >
              切换到{viewMode === 'right' ? '居中' : '右侧'}布局
            </button>
          </div>
        </div>
      </header>
      
      {/* 主要内容区域 */}
      <main className="flex-grow container mx-auto p-4">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            <h2 className="text-lg font-medium mb-2">加载错误</h2>
            <p>{error}</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <ErrorBoundary>
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden" style={{ height: '80vh' }}>
              <ReactFlowMap
                data={mindMapData}
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
      </main>
      
      {/* 页脚 */}
      <footer className="bg-white border-t py-4">
        <div className="container mx-auto text-center text-gray-500 text-sm">
          思维导图 &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
} 