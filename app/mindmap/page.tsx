'use client'

import React, { useState, useEffect } from 'react';
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
export default function MindmapPage() {
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
  const fetchTestData = async () => {
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
  };
  
  // 获取活跃思维导图
  const fetchActiveMindmap = async () => {
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
  };
  
  // 获取思维导图数据
  const fetchMindmapData = async (id: string) => {
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
  };
  
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
  
  // 初始加载
  useEffect(() => {
    fetchActiveMindmap();
  }, []);
  
  return (
    <div className={`mindmap-container ${darkMode ? 'dark-theme' : ''}`}>
      {/* 控制栏 */}
      <div className="control-panel">
        <button
          onClick={toggleDirection}
          className="control-button"
          title={direction === 'horizontal' ? '切换到垂直布局' : '切换到水平布局'}
        >
          <FiLayout />
          <span className="button-text">{direction === 'horizontal' ? '垂直布局' : '水平布局'}</span>
        </button>
        
        <button
          onClick={toggleTheme}
          className="control-button"
          title={darkMode ? '切换到亮色主题' : '切换到暗色主题'}
        >
          {darkMode ? <FiSun /> : <FiMoon />}
          <span className="button-text">{darkMode ? '亮色主题' : '暗色主题'}</span>
        </button>
        
        <button
          onClick={toggleDataSource}
          className="control-button"
          title={useTestData ? '切换到真实数据' : '切换到测试数据'}
        >
          <FiRefreshCw />
          <span className="button-text">{useTestData ? '真实数据' : '测试数据'}</span>
        </button>
        
        <button
          onClick={refreshMindmap}
          className="control-button"
          title="刷新思维导图"
        >
          <FiRefreshCw />
          <span className="button-text">刷新</span>
        </button>
      </div>
      
      {/* 主要内容区 */}
      <div className="mindmap-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>思维导图加载中...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button onClick={refreshMindmap} className="retry-button">
              重试
            </button>
            <button onClick={fetchTestData} className="test-data-button">
              使用测试数据
            </button>
          </div>
        ) : mapData ? (
          <ErrorBoundary>
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden" style={{ height: '80vh' }}>
              <ReactFlowMap
                data={mapData}
                direction={direction}
                theme={darkMode ? 'dark' : 'primary'}
              />
            </div>
            {useTestData && (
              <div className="text-center mt-2 text-xs text-gray-500">
                当前使用测试数据，无需数据库连接
              </div>
            )}
          </ErrorBoundary>
        ) : (
          <div className="empty-container">
            <p>没有思维导图数据</p>
            <button onClick={fetchTestData} className="test-data-button">
              使用测试数据
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 