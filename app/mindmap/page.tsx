'use client'

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import axios, { AxiosError } from 'axios';
import { supabase } from '../../lib/supabase';
import { FiRefreshCw, FiLayout, FiSun, FiMoon } from 'react-icons/fi';
import "./mindmap.css";
import ErrorBoundary from '../../components/error-boundary';

// 动态加载ReactFlowMap组件
const ReactFlowMap = dynamic(() => import('../../components/ReactFlowMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full">
      <div className="animate-pulse text-gray-500">思维导图加载中...</div>
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
    
    // 确保完整性的递归函数
    const ensureNodeStructure = (node: any) => {
      if (!node) return null;
      
      // 确保节点有ID
      if (!node.id) {
        node.id = `node-${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // 确保节点有topic
      if (!node.topic && (node.text || node.title)) {
        node.topic = node.text || node.title;
      }
      
      // 确保expanded属性存在
      if (node.expanded === undefined) {
        node.expanded = true;
      }
      
      // 递归处理子节点
      if (node.children && Array.isArray(node.children)) {
        node.children = node.children.map((child: any) => ensureNodeStructure(child)).filter(Boolean);
      } else {
        node.children = [];
      }
      
      return node;
    };
    
    // 处理nodeData格式
    if (data.nodeData && typeof data.nodeData === 'object') {
      console.log('检测到nodeData格式');
      // 递归处理确保所有节点结构完整
      const processedData = { 
        nodeData: ensureNodeStructure(data.nodeData)
      };
      return processedData;
    }
    
    // 处理直接包含id和topic的格式
    if (data.id && data.topic) {
      console.log('检测到id/topic直接格式，转换为nodeData格式');
      return {
        nodeData: ensureNodeStructure(data)
      };
    }
    
    // 处理仅包含topic的格式
    if (data.topic) {
      console.log('检测到仅包含topic的格式，添加id并转换为nodeData格式');
      return {
        nodeData: ensureNodeStructure({
          ...data,
          id: data.id || 'root'
        })
      };
    }
    
    // 尝试识别其他可能的格式
    if (data.root && typeof data.root === 'object') {
      console.log('检测到root对象格式，转换为nodeData格式');
      return {
        nodeData: ensureNodeStructure(data.root)
      };
    }
    
    if (data.nodes && Array.isArray(data.nodes) && data.nodes.length > 0) {
      console.log('检测到nodes数组格式，转换为nodeData格式');
      // 创建根节点，并将所有节点作为子节点
      const rootNode = {
        id: 'root',
        topic: '思维导图',
        expanded: true,
        children: data.nodes.map((node: any) => ensureNodeStructure(node)).filter(Boolean)
      };
      return { nodeData: rootNode };
    }
    
    // 处理未知格式
    console.warn('未知数据格式，使用默认思维导图数据', data);
    return DEFAULT_MINDMAP_DATA;
  } catch (error) {
    console.error('验证和转换数据时出错', error);
    return DEFAULT_MINDMAP_DATA;
  }
}

// 思维导图页面主内容组件
function MindmapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [mapData, setMapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [direction, setDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [useTestData, setUseTestData] = useState(false);
  
  // 获取测试数据
  const fetchTestData = useCallback(async () => {
    try {
      console.log('获取测试思维导图数据');
      setLoading(true);
      
      const response = await axios.get('/api/mindmap-test');
      
      if (response.data) {
        console.log('测试思维导图数据获取成功');
        setMapData(response.data);
        setUseTestData(true);
      } else {
        setError('获取测试思维导图数据失败');
      }
    } catch (err: unknown) {
      console.error('获取测试思维导图数据时出错:', err);
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(`获取测试思维导图数据时出错: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 获取思维导图数据
  const fetchMindmapData = useCallback(async (id: string) => {
    try {
      console.log(`正在获取思维导图数据, ID: ${id}`);
      const response = await axios.get(`/api/mindmap-data?id=${id}`);
      
      if (response.data) {
        console.log('思维导图数据获取成功');
        setMapData(response.data);
      } else {
        throw new Error('获取思维导图数据失败');
      }
    } catch (err: unknown) {
      console.error('获取思维导图数据时出错:', err);
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      throw new Error(`获取思维导图数据失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 获取活跃思维导图
  const fetchActiveMindmap = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // 先检查是否强制使用测试数据
      if (searchParams.get('test') === 'true') {
        await fetchTestData();
        return;
      }
      
      // 先从URL参数获取ID
      const id = searchParams.get('id');
      
      // 如果URL中有ID，直接使用
      if (id) {
        setActiveId(id);
        try {
          await fetchMindmapData(id);
        } catch (fetchError) {
          console.error('获取思维导图数据失败，尝试使用测试数据:', fetchError);
          await fetchTestData();
        }
        return;
      }
      
      // 检查 supabase 是否可用
      if (!supabase) {
        console.error('Supabase 客户端未初始化，可能是环境变量缺失');
        console.log('使用测试数据作为备选');
        await fetchTestData();
        return;
      }
      
      try {
        // 先不使用single()查询，避免在没有活跃数据时出错
        const { data, error } = await supabase
          .from('mindmaps')
          .select('id')
          .eq('is_active', true)
          .limit(1);
        
        // 改进错误处理逻辑，只有当错误对象有实际内容时才视为错误
        if (error && Object.keys(error).length > 0) {
          console.error('获取活跃思维导图失败:', error);
          console.log('使用测试数据作为备选');
          await fetchTestData();
          return;
        }
        
        // 即使error是空对象{}，也继续检查data
        if (data && data.length > 0) {
          setActiveId(data[0].id);
          try {
            await fetchMindmapData(data[0].id);
          } catch (fetchError) {
            console.error('获取思维导图数据失败，尝试使用测试数据:', fetchError);
            await fetchTestData();
          }
        } else {
          console.log('未找到活跃的思维导图，使用测试数据');
          await fetchTestData();
        }
      } catch (queryError) {
        console.error('查询活跃思维导图时出错:', queryError);
        console.log('使用测试数据作为备选');
        await fetchTestData();
      }
    } catch (err: any) {
      console.error('获取活跃思维导图流程出错:', err);
      setError('获取思维导图数据失败，请刷新页面重试');
      setLoading(false);
    }
  }, [searchParams, fetchTestData, fetchMindmapData]);
  
  // 切换布局方向
  const toggleDirection = () => {
    setDirection(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
  };
  
  // 切换主题模式
  const toggleTheme = () => {
    setDarkMode(prev => !prev);
    // 应用深色/浅色主题到文档
    document.documentElement.classList.toggle('dark-theme');
  };
  
  // 切换数据源
  const toggleDataSource = async () => {
    setLoading(true);
    if (useTestData) {
      // 从测试数据切换到真实数据
      setUseTestData(false);
      await fetchActiveMindmap();
    } else {
      // 从真实数据切换到测试数据
      await fetchTestData();
    }
  };
  
  // 刷新思维导图
  const refreshMindmap = () => {
    if (useTestData) {
      fetchTestData();
    } else if (activeId) {
      setLoading(true);
      fetchMindmapData(activeId).catch(err => {
        console.error('刷新思维导图失败:', err);
        fetchTestData();
      });
    } else {
      fetchActiveMindmap();
    }
  };
  
  // 在组件挂载时加载思维导图数据
  useEffect(() => {
    fetchActiveMindmap();
    
    // 从URL获取深色模式设置
    if (searchParams.get('dark') === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark-theme');
    }
  }, [searchParams, fetchActiveMindmap]);
  
  return (
    <div className={`flex flex-col h-screen w-full ${darkMode ? 'dark-theme' : ''}`}>
      <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 shadow-sm">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">思维导图</h1>
        <div className="flex space-x-2">
          {useTestData && (
            <div className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
              使用测试数据
            </div>
          )}
          <button
            onClick={refreshMindmap}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="刷新思维导图"
          >
            <FiRefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={toggleDirection}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title={`切换到${direction === 'horizontal' ? '垂直' : '水平'}布局`}
          >
            <FiLayout className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title={`切换到${darkMode ? '浅色' : '深色'}主题`}
          >
            {darkMode ? (
              <FiSun className="w-5 h-5 text-gray-300" />
            ) : (
              <FiMoon className="w-5 h-5 text-gray-600" />
            )}
          </button>
          <button
            onClick={toggleDataSource}
            className={`px-3 py-1 rounded text-sm ${
              useTestData 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {useTestData ? '切换到真实数据' : '切换到测试数据'}
          </button>
        </div>
      </div>
      
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="max-w-md p-4 bg-red-50 border border-red-200 rounded text-red-600">
              {error}
              <button 
                onClick={refreshMindmap}
                className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded-full text-sm"
              >
                重试
              </button>
            </div>
          </div>
        ) : (
          <ErrorBoundary
            fallback={<div className="p-4 text-red-500">思维导图渲染错误，请尝试刷新页面。</div>}
          >
            <ReactFlowMap 
              data={validateAndTransform(mapData)}
              direction={direction}
              theme={darkMode ? 'dark' : 'primary'}
            />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}

// 思维导图页面组件
export default function MindmapPage() {
  return (
    <ErrorBoundary fallback={<div className="p-4 text-red-500">加载思维导图页面时出错，请刷新页面重试。</div>}>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">加载中...</div>}>
        <MindmapContent />
      </Suspense>
    </ErrorBoundary>
  );
} 