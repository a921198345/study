'use client'

import React, { useState, useEffect } from 'react';
import MindElixirMap from '../../components/MindElixirMap';
import '../../styles/mind-elixir.css';

// 示例数据
const sampleData = {
  id: 'root',
  title: '民法思维导图',
  level: 0,
  children: [
    {
      id: 'civil1',
      title: '民法总则',
      level: 1,
      children: [
        { id: 'civil1-1', title: '基本规定', level: 2 },
        { id: 'civil1-2', title: '自然人', level: 2 },
        { id: 'civil1-3', title: '法人', level: 2 },
        { id: 'civil1-4', title: '民事法律行为', level: 2 },
        { id: 'civil1-5', title: '代理', level: 2 },
        { id: 'civil1-6', title: '民事权利', level: 2 },
        { id: 'civil1-7', title: '民事责任', level: 2 },
        { id: 'civil1-8', title: '诉讼时效', level: 2 }
      ]
    },
    {
      id: 'civil2',
      title: '物权法',
      level: 1,
      children: [
        { id: 'civil2-1', title: '通则', level: 2 },
        { id: 'civil2-2', title: '所有权', level: 2 },
        { id: 'civil2-3', title: '用益物权', level: 2 },
        { id: 'civil2-4', title: '担保物权', level: 2 },
        { id: 'civil2-5', title: '占有', level: 2 }
      ]
    },
    {
      id: 'civil3',
      title: '合同法',
      level: 1,
      children: [
        { id: 'civil3-1', title: '通则', level: 2 },
        { id: 'civil3-2', title: '订立', level: 2 },
        { id: 'civil3-3', title: '效力', level: 2 },
        { id: 'civil3-4', title: '履行', level: 2 },
        { id: 'civil3-5', title: '保全', level: 2 },
        { id: 'civil3-6', title: '转让和终止', level: 2 },
        { id: 'civil3-7', title: '违约责任', level: 2 },
        { id: 'civil3-8', title: '各类合同', level: 2 }
      ]
    },
    {
      id: 'civil4',
      title: '人格权法',
      level: 1,
      children: [
        { id: 'civil4-1', title: '一般规定', level: 2 },
        { id: 'civil4-2', title: '生命权、身体权和健康权', level: 2 },
        { id: 'civil4-3', title: '姓名权和名称权', level: 2 },
        { id: 'civil4-4', title: '肖像权', level: 2 },
        { id: 'civil4-5', title: '名誉权和荣誉权', level: 2 },
        { id: 'civil4-6', title: '隐私权和个人信息保护', level: 2 }
      ]
    },
    {
      id: 'civil5',
      title: '婚姻家庭',
      level: 1,
      children: [
        { id: 'civil5-1', title: '一般规定', level: 2 },
        { id: 'civil5-2', title: '结婚', level: 2 },
        { id: 'civil5-3', title: '家庭关系', level: 2 },
        { id: 'civil5-4', title: '离婚', level: 2 },
        { id: 'civil5-5', title: '收养', level: 2 }
      ]
    }
  ]
};

export default function MindMapDemo() {
  const [jsonData, setJsonData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'right' | 'side'>('right');
  const [theme, setTheme] = useState<'primary' | 'dark' | 'green' | 'purple'>('primary');

  // 模拟从API加载数据
  useEffect(() => {
    // 实际项目中，可以从API获取数据
    setTimeout(() => {
      try {
        setJsonData(sampleData);
        setLoading(false);
      } catch (err) {
        setError('加载思维导图数据失败');
        setLoading(false);
      }
    }, 1000);
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">民法思维导图演示</h1>
      
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
        {loading ? (
          <div className="flex items-center justify-center h-[600px] bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[600px] bg-red-50 text-red-500">
            {error}
          </div>
        ) : jsonData ? (
          <MindElixirMap 
            data={jsonData} 
            direction={viewMode}
            draggable={true}
            editable={false}
            contextMenu={false}
            theme={theme}
            height="600px"
            width="100%"
            className="bg-white"
          />
        ) : (
          <div className="flex items-center justify-center h-[600px] bg-gray-50">
            暂无数据
          </div>
        )}
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>说明：</p>
        <ul className="list-disc pl-5">
          <li>可以通过上方按钮切换布局和主题</li>
          <li>鼠标滚轮可以缩放思维导图</li>
          <li>按住鼠标左键可以拖动整个思维导图</li>
          <li>点击节点可以选中节点</li>
        </ul>
      </div>
    </div>
  );
} 