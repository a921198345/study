'use client'

import React, { useEffect, useRef, useState } from 'react';
// 不使用dynamic import，改为在useEffect中手动导入

// 定义节点数据结构
interface MindNode {
  id: string;
  topic: string;
  children?: MindNode[];
  expanded?: boolean;
  direction?: 'right' | 'left';
  style?: {
    background?: string;
    color?: string;
    fontSize?: string;
  };
}

// 思维导图组件属性
interface MindElixirMapProps {
  data: MindNode | any;
  direction?: 'right' | 'side';
  draggable?: boolean;
  editable?: boolean;
  contextMenu?: boolean;
  theme?: 'primary' | 'dark' | 'green' | 'purple';
  height?: string;
  width?: string;
  className?: string;
}

// 默认思维导图数据 - 最简单的有效结构
const DEFAULT_MIND_DATA = {
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

const MindElixirMap: React.FC<MindElixirMapProps> = ({
  data,
  direction = 'right',
  draggable = true,
  editable = false,
  contextMenu = false,
  theme = 'primary',
  height = '600px',
  width = '100%',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindElixirRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // 确保在客户端渲染
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // 确保只在客户端执行
    if (!isClient || !containerRef.current) return;
    
    // 清除现有实例
    if (mindElixirRef.current) {
      try {
        if (mindElixirRef.current.bus) {
          mindElixirRef.current.bus.removeAllListeners();
        }
        mindElixirRef.current = null;
      } catch (e) {
        console.error('清除思维导图实例失败:', e);
      }
    }

    // 确保容器为空
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    
    // 在客户端动态导入MindElixir
    const loadMindElixir = async () => {
      try {
        // 动态导入MindElixir
        const MindElixirModule = await import('mind-elixir');
        const ME = MindElixirModule.default;
        
        if (!ME || typeof ME !== 'function') {
          throw new Error('无法加载MindElixir库');
        }
        
        // 准备数据 - 不进行复杂处理，直接使用简单结构
        let mindData = DEFAULT_MIND_DATA;
        
        // 如果有提供数据，简单处理确保基本结构
        if (data) {
          try {
            // 构建适合MindElixir的数据结构
            const processedData = {
              nodeData: {
                id: data.id || 'root',
                topic: data.topic || data.title || data.text || '思维导图',
                expanded: true,
                children: []
              }
            };

            // 处理子节点(如果存在)
            if (data.children && Array.isArray(data.children)) {
              processedData.nodeData.children = data.children.map(child => ({
                id: child.id || `node_${Math.random().toString(36).substr(2, 5)}`,
                topic: child.topic || child.title || child.text || '节点',
                expanded: true
              }));
            }

            mindData = processedData;
          } catch (e) {
            console.error('处理数据失败，使用默认数据:', e);
            // 使用默认数据
          }
        }
        
        // 创建Mind Elixir选项
        const options = {
          el: containerRef.current,
          direction: direction === 'side' ? 2 : 1, // 1: 右侧布局, 2: 居中布局
          draggable: Boolean(draggable),
          contextMenu: Boolean(contextMenu),
          contextMenuOption: contextMenu ? {
            focus: true,
          } : undefined,
          allowUndo: Boolean(editable),
          overflowHidden: false,
          mainColor: getThemeColor(theme),
          mainFontColor: '#fff'
        };
        
        // 直接提供数据选项
        const meOptions = { ...options, data: mindData };
        
        // 创建MindElixir实例
        try {
          mindElixirRef.current = new ME(meOptions);
          
          // 初始化思维导图
          mindElixirRef.current.init();
          
          // 设置只读模式（如果不可编辑）
          if (!editable && mindElixirRef.current.operation) {
            mindElixirRef.current.operation.readonly();
          }
        } catch (initError) {
          console.error('MindElixir初始化失败:', initError);
          setError(`初始化失败: ${initError instanceof Error ? initError.message : '未知错误'}`);
        }
      } catch (err) {
        console.error('加载思维导图库出错:', err);
        setError(`加载失败: ${err instanceof Error ? err.message : '未知错误'}`);
      }
    };
    
    loadMindElixir();
    
    // 组件卸载时清理
    return () => {
      if (mindElixirRef.current && mindElixirRef.current.bus) {
        try {
          // 清理事件监听器等资源
          mindElixirRef.current.bus.removeAllListeners();
        } catch (error) {
          console.error('清理事件监听器失败:', error);
        }
      }
    };
  }, [data, direction, draggable, editable, contextMenu, theme, isClient]);

  // 获取主题颜色
  const getThemeColor = (themeName: string): string => {
    switch (themeName) {
      case 'dark': return '#34495e';
      case 'green': return '#27ae60';
      case 'purple': return '#8e44ad';
      default: return '#3498db';
    }
  };

  // 如果不是客户端环境，显示加载状态或空白内容
  if (!isClient) {
    return (
      <div className={`mind-elixir-container ${className}`} style={{ width, height }}>
        <div className="flex items-center justify-center h-full">
          <p>加载思维导图中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`mind-elixir-container ${className}`} style={{ width, height }}>
      {error ? (
        <div className="error-message p-4 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      ) : (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      )}
    </div>
  );
};

export default MindElixirMap; 