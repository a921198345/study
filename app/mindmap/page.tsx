'use client'

import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
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
    
    // 生成唯一ID的辅助函数
    const generateUniqueId = () => {
      return `node-${Math.random().toString(36).substring(2, 11)}`;
    };
    
    // 确保完整性的递归函数 - 增强版
    const ensureNodeStructure = (node: any, parentId: string | null = null, level: number = 0) => {
      if (!node) return null;
      
      // 确保节点有ID
      if (!node.id) {
        node.id = generateUniqueId();
        console.log(`为节点添加ID: ${node.id}`);
      }
      
      // 确保节点有topic
      if (!node.topic && (node.text || node.title || node.content || node.name)) {
        node.topic = node.text || node.title || node.content || node.name || '未命名节点';
        console.log(`为节点 ${node.id} 设置topic: ${node.topic.substring(0, 20)}...`);
      } else if (!node.topic) {
        node.topic = '节点 ' + node.id;
        console.log(`节点缺少标题，设置默认标题: ${node.topic}`);
      }
      
      // 确保expanded属性存在并默认为true
      if (node.expanded === undefined) {
        node.expanded = true;
      }
      
      // 如果有direction属性，确保是有效值
      if (node.direction && !['left', 'right'].includes(node.direction)) {
        delete node.direction;
      }
      
      // 确保样式对象存在
      if (!node.style) {
        node.style = {};
      }
      
      // 递归处理子节点
      if (node.children) {
        if (!Array.isArray(node.children)) {
          console.warn(`节点 ${node.id} 的children属性不是数组，将被转换为空数组`);
          node.children = [];
        } else {
          node.children = node.children
            .map((child: any, index: number) => 
              ensureNodeStructure(child, node.id, level + 1)
            )
            .filter(Boolean); // 过滤掉null或undefined
          
          console.log(`处理节点 ${node.id} 的 ${node.children.length} 个子节点`);
        }
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
      console.log(`数据处理完成，根节点ID: ${processedData.nodeData.id}`);
      return processedData;
    }
    
    // 处理直接包含id和topic的格式
    if (data.id && (data.topic || data.text || data.title)) {
      console.log('检测到id/topic直接格式，转换为nodeData格式');
      return {
        nodeData: ensureNodeStructure(data)
      };
    }
    
    // 处理仅包含topic的格式
    if (data.topic || data.text || data.title) {
      console.log('检测到包含topic/text/title的格式，添加id并转换为nodeData格式');
      return {
        nodeData: ensureNodeStructure({
          ...data,
          id: data.id || 'root'
        })
      };
    }
    
    // 处理数组格式
    if (Array.isArray(data)) {
      console.log('检测到数组格式，创建包含所有项的根节点');
      const rootNode = {
        id: 'root',
        topic: '思维导图',
        expanded: true,
        children: data.map(item => ensureNodeStructure(item)).filter(Boolean)
      };
      return { nodeData: rootNode };
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
    
    // 如果没有找到匹配的格式但是存在对象结构，尝试转换为节点
    if (typeof data === 'object' && Object.keys(data).length > 0) {
      console.log('尝试将未知格式的对象转换为节点');
      // 查找可能的键值对作为节点结构
      const possibleNode = {
        id: data.id || generateUniqueId(),
        topic: data.topic || data.text || data.title || data.name || data.label || '思维导图',
        expanded: true
      };
      
      return {
        nodeData: ensureNodeStructure(possibleNode)
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

interface MindmapContentProps {
  activeId?: string;
  showSuccessMessage?: boolean;
}

function MindmapContent({ activeId, showSuccessMessage = false }: MindmapContentProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useTestData, setUseTestData] = useState(false);
  const [direction, setDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [theme, setTheme] = useState<'primary' | 'dark' | 'green' | 'purple'>('primary');
  const [loadingCivilLaw, setLoadingCivilLaw] = useState(false);
  const [mapStats, setMapStats] = useState<any>({
    totalNodes: 0,
    visibleNodes: 0,
    hiddenNodes: 0,
    maxDepth: 0
  });
  
  // 用于显示加载状态信息
  const loadingRef = useRef<HTMLDivElement>(null);
  
  // 用于控制数据源切换
  const [dataSource, setDataSource] = useState<'active' | 'test' | 'supabase'>('active');
  
  // 使用useCallback确保函数不会频繁重建
  const refreshMindmap = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let mindmapData;
      
      // 根据数据源加载不同数据
      if (dataSource === 'test') {
        console.log('加载测试数据...');
        const response = await fetch('/api/mindmap-test');
        if (!response.ok) {
          throw new Error(`获取测试数据失败: ${response.status} ${response.statusText}`);
        }
        mindmapData = await response.json();
      } else if (dataSource === 'supabase' && activeId) {
        console.log(`从Supabase加载ID=${activeId}的数据...`);
        const response = await fetch(`/api/mindmap-data?id=${activeId}`);
        if (!response.ok) {
          throw new Error(`获取思维导图数据失败: ${response.status} ${response.statusText}`);
        }
        mindmapData = await response.json();
      } else {
        console.log('加载活跃思维导图数据...');
        const response = await fetch('/api/active-mindmap');
        if (!response.ok) {
          throw new Error(`获取活跃思维导图数据失败: ${response.status} ${response.statusText}`);
        }
        mindmapData = await response.json();
      }
      
      if (mindmapData.error) {
        throw new Error(`加载思维导图数据错误: ${mindmapData.error}`);
      }
      
      console.log('思维导图数据加载成功', mindmapData);
      
      // 检查数据是否包含元数据
      if (mindmapData.meta) {
        // 显示加载数据统计
        const { totalNodes, processedNodes, skippedNodes, maxDepthReached } = mindmapData.meta;
        console.log(`思维导图统计信息 - 总节点数: ${totalNodes}, 已处理: ${processedNodes}, 已跳过: ${skippedNodes}`);
        
        if (maxDepthReached) {
          console.warn(`由于深度限制，部分深层节点未显示`);
        }
        
        // 更新加载状态信息
        if (loadingRef.current) {
          loadingRef.current.textContent = `已加载 ${processedNodes} 个节点，跳过 ${skippedNodes} 个节点`;
        }
      }
      
      setData(mindmapData);
      setLoading(false);
    } catch (err) {
      console.error('加载思维导图数据失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
      setLoading(false);
    }
  }, [activeId, dataSource]);
  
  // 在组件挂载后加载数据
  useEffect(() => {
    refreshMindmap();
  }, [refreshMindmap]);
  
  // 在activeId更改时刷新
  useEffect(() => {
    if (activeId) {
      refreshMindmap();
    }
  }, [activeId, refreshMindmap]);
  
  // 切换数据源
  const toggleDataSource = useCallback((source: 'active' | 'test' | 'supabase') => {
    setDataSource(source);
    // 切换后自动刷新
    setTimeout(() => refreshMindmap(), 0);
  }, [refreshMindmap]);
  
  // 加载民法测试数据
  const loadCivilLawData = useCallback(async () => {
    setLoadingCivilLaw(true);
    setLoading(true);
    setError(null);
    
    // 显示加载状态提示
    if (loadingRef.current) {
      loadingRef.current.textContent = '正在加载民法思维导图数据...';
    }
    
    try {
      console.log('加载完整民法思维导图数据...');
      
      // 增加maxNodes和maxDepth参数显著提高以显示更完整的内容
      const response = await fetch('/api/mindmap-test?type=civil-law&maxNodes=100000&maxDepth=30');
      
      if (!response.ok) {
        throw new Error(`加载民法数据失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('民法数据加载成功，数据大小:', JSON.stringify(data).length);
      
      // 显示加载数据统计（如果有）
      if (data.meta) {
        const { totalNodes, processedNodes, skippedNodes, maxDepthReached } = data.meta;
        console.log(`民法数据 - 总节点数: ${totalNodes}, 已处理: ${processedNodes}, 已跳过: ${skippedNodes}`);
        
        if (maxDepthReached) {
          console.warn(`由于深度限制，部分深层节点未显示`);
        }
        
        // 更新加载状态信息
        if (loadingRef.current) {
          loadingRef.current.textContent = `已加载 ${processedNodes} 个节点，跳过 ${skippedNodes} 个节点`;
        }
      }
      
      // 确保数据格式正确
      const validatedData = validateAndTransform(data);
      console.log('数据验证完成，准备设置状态...');
      setData(validatedData);
      setDataSource('civil-law');
      
      // 3秒后自动隐藏消息
      setTimeout(() => setError(null), 3000);
    } catch (error) {
      console.error('加载民法数据出错:', error);
      setError(`加载民法数据出错: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
      setLoadingCivilLaw(false);
    }
  }, []);
  
  // 处理地图统计信息
  const handleMapStats = useCallback((stats: any) => {
    setMapStats(stats);
    // 更新加载状态信息
    if (loadingRef.current && stats.visibleNodes > 0) {
      loadingRef.current.textContent = `显示 ${stats.visibleNodes}/${stats.totalNodes} 个节点，当前深度 ${stats.loadedDepth}/${stats.maxDepth}`;
    }
  }, []);
  
  // 切换方向
  const toggleDirection = useCallback(() => {
    setDirection(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
  }, []);
  
  // 切换主题
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const themes: Array<'primary' | 'dark' | 'green' | 'purple'> = ['primary', 'dark', 'green', 'purple'];
      const currentIndex = themes.indexOf(prev);
      return themes[(currentIndex + 1) % themes.length];
    });
  }, []);
  
  return (
    <div className="mindmap-container" style={{ width: '100%', height: 'calc(100vh - 100px)' }}>
      <div className="toolbar mb-2 p-2 bg-white shadow-sm rounded-md flex flex-wrap gap-2 items-center">
        <button
          onClick={refreshMindmap}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          disabled={loading}
        >
          刷新
        </button>
        
        <div className="flex space-x-2">
          <button
            onClick={() => toggleDataSource('active')}
            className={`px-3 py-1 rounded text-sm ${
              dataSource === 'active' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            活跃文件
          </button>
          <button
            onClick={() => toggleDataSource('test')}
            className={`px-3 py-1 rounded text-sm ${
              dataSource === 'test' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            测试数据
          </button>
          <button
            onClick={() => toggleDataSource('supabase')}
            className={`px-3 py-1 rounded text-sm ${
              dataSource === 'supabase' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            disabled={!activeId}
          >
            Supabase数据
          </button>
        </div>
        
        <button
          onClick={loadCivilLawData}
          className={`px-3 py-1 rounded text-sm ${
            loadingCivilLaw 
              ? 'bg-gray-400 text-white cursor-not-allowed' 
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
          disabled={loadingCivilLaw}
        >
          {loadingCivilLaw ? '加载中...' : '加载民法数据'}
        </button>
        
        <button
          onClick={toggleDirection}
          className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
        >
          {direction === 'horizontal' ? '切换垂直布局' : '切换水平布局'}
        </button>
        
        <button
          onClick={toggleTheme}
          className="px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 text-sm"
        >
          切换主题
        </button>
        
        <div className="ml-auto text-xs text-gray-600 flex items-center">
          <div className="mr-4">
            <div>数据源: <span className="font-medium">{
              dataSource === 'active' ? '活跃文件' : 
              dataSource === 'test' ? '测试数据' : 'Supabase'
            }</span></div>
            <div>节点统计: <span className="font-medium">{mapStats.visibleNodes}/{mapStats.totalNodes}</span></div>
          </div>
          <div ref={loadingRef} className="status-message">
            {loading ? '加载中...' : '就绪'}
          </div>
        </div>
      </div>
      
      {error ? (
        <div className="error-container p-4 border border-red-300 bg-red-50 rounded-md text-red-700">
          <div className="font-medium mb-2">加载思维导图失败</div>
          <div>{error}</div>
          <button
            onClick={refreshMindmap}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            重试
          </button>
        </div>
      ) : (
        <div className="mindmap-wrapper" style={{ width: '100%', height: 'calc(100vh - 150px)' }}>
          {data ? (
            <ReactFlowMap 
              data={data} 
              direction={direction} 
              theme={theme}
              height="100%" 
              width="100%"
              maxInitialNodes={5000}
              batchSize={1000}
              onMapStats={handleMapStats}
            />
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-4">
              <div className="text-gray-700 mb-2 font-medium">加载思维导图中...</div>
              <div className="loader"></div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50 p-4">
              <div className="text-gray-500">无可用数据，请刷新或选择其他数据源</div>
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        .loader {
          border: 5px solid #f3f3f3;
          border-radius: 50%;
          border-top: 5px solid #3498db;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
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