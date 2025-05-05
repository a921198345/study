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

// 默认思维导图数据
const DEFAULT_MIND_DATA = {
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
};

// OPML数据转换为Mind-Elixir数据格式
const convertOpmlToMindElixir = (data: any): MindNode => {
  // 如果数据为空或undefined，使用默认数据
  if (!data) {
    return DEFAULT_MIND_DATA;
  }
  
  // 如果传入的是数组，取第一个元素作为根节点
  const rootNode = Array.isArray(data) ? data[0] : data;
  
  const convertNode = (node: any): MindNode => {
    const mindNode: MindNode = {
      id: node.id || `node_${Math.random().toString(36).substr(2, 9)}`,
      topic: node.title || node.text || node.topic || '未命名节点',
      expanded: true
    };
    
    // 处理子节点
    if (node.children && node.children.length > 0) {
      mindNode.children = node.children.map(convertNode);
    }
    
    // 根据层级设置不同的样式
    if (node.level) {
      const level = parseInt(node.level);
      if (level === 0) {
        mindNode.style = { background: '#3498db', color: '#fff' };
      } else if (level === 1) {
        mindNode.style = { background: '#e74c3c', color: '#fff' };
      } else if (level === 2) {
        mindNode.style = { background: '#2ecc71', color: '#fff' };
      } else {
        mindNode.style = { background: '#f39c12', color: '#fff' };
      }
    }
    
    return mindNode;
  };
  
  return convertNode(rootNode);
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
    
    // 在客户端动态导入MindElixir
    const loadMindElixir = async () => {
      try {
        // 清空容器内容，防止重复渲染
        containerRef.current!.innerHTML = '';
        
        // 动态导入MindElixir
        const MindElixirModule = (await import('mind-elixir')).default;
        
        // 准备数据，确保数据有效
        let mindData;
        try {
          mindData = convertOpmlToMindElixir(data);
          
          // 验证数据结构是否符合Mind-Elixir要求
          if (!mindData.topic || typeof mindData.topic !== 'string') {
            console.warn('思维导图数据缺少必要的topic字段，使用默认数据');
            mindData = DEFAULT_MIND_DATA;
          }
        } catch (dataError) {
          console.error('数据转换错误:', dataError);
          mindData = DEFAULT_MIND_DATA;
        }
        
        // 创建Mind Elixir实例，使用any类型绕过类型检查
        const options: any = {
          el: containerRef.current,
          direction: direction === 'side' ? 2 : 1, // 1: 右侧布局, 2: 居中布局
          data: {
            nodeData: mindData
          },
          draggable: draggable,
          contextMenu: contextMenu,
          contextMenuOption: contextMenu ? {
            focus: true,
          } : undefined,
          allowUndo: editable,
          overflowHidden: false,
          mainColor: getThemeColor(theme),
          mainFontColor: '#fff',
        };
        
        mindElixirRef.current = new MindElixirModule(options);
        
        // 初始化思维导图
        mindElixirRef.current.init();
        
        // 设置只读模式（如果不可编辑）
        if (!editable) {
          mindElixirRef.current.operation.readonly();
        }
        
        // 事件监听
        mindElixirRef.current.bus.addListener('operation', (operation: any) => {
          console.log('思维导图操作:', operation);
        });
        
        mindElixirRef.current.bus.addListener('selectNode', (node: any) => {
          console.log('节点选择:', node);
        });
      } catch (err) {
        console.error('初始化思维导图出错:', err);
        setError(`初始化思维导图失败: ${err instanceof Error ? err.message : '未知错误'}`);
      }
    };
    
    loadMindElixir();
    
    // 组件卸载时清理
    return () => {
      if (mindElixirRef.current) {
        // 清理事件监听器等资源
        mindElixirRef.current.bus.removeAllListeners();
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