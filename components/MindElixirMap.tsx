'use client'

import React, { useEffect, useRef, useState } from 'react';

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

// 判断数据是否有效
const isValidData = (data: any): boolean => {
  // 检查数据是否存在
  if (!data) return false;
  
  // 检查是否是对象
  if (typeof data !== 'object') return false;

  // 如果是数组，至少应该有一个元素
  if (Array.isArray(data)) {
    return data.length > 0 && isValidData(data[0]);
  }

  // nodeData嵌套情况
  if (data.nodeData) {
    return isValidData(data.nodeData);
  }

  // 基本节点结构检查
  return Boolean(data.id) && Boolean(data.topic);
};

// 处理OPML格式的数据转换为Mind Elixir格式
const convertOpmlToMindElixir = (data: any) => {
  try {
    // 如果没有数据，使用默认数据
    if (!data) {
      console.warn('未提供数据，使用默认思维导图');
      return DEFAULT_MIND_DATA;
    }

    // 避免JSON序列化错误
    // 在这里尝试序列化再解析，确保没有循环引用
    let sanitizedData;
    try {
      const dataStr = JSON.stringify(data);
      sanitizedData = JSON.parse(dataStr);
    } catch (jsonError) {
      console.error('数据序列化失败，可能存在循环引用:', jsonError);
      return DEFAULT_MIND_DATA;
    }
    
    // 确保所有节点都有唯一ID的函数
    const ensureNodeIds = (node: any, prefix = 'node') => {
      if (!node) return null;
      
      // 确保节点有ID
      if (!node.id) {
        node.id = `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
      } else {
        node.id = String(node.id);
      }
      
      // 递归处理子节点
      if (node.children && Array.isArray(node.children)) {
        node.children = node.children.map((child: any, index: number) => 
          ensureNodeIds(child, `${prefix}-${index}`)
        );
      }
      
      return node;
    };
    
    // 检查是否已经是Mind-Elixir格式
    if (sanitizedData.nodeData) {
      console.log('检测到Mind-Elixir格式数据');
      
      // 确保所有节点都有ID
      sanitizedData.nodeData = ensureNodeIds(sanitizedData.nodeData);
      
      return sanitizedData;
    }
    
    // 检查是否是API返回的OPML处理结果
    if (sanitizedData.tree && Array.isArray(sanitizedData.tree)) {
      console.log('检测到API处理的OPML数据，进行转换');
      
      // 获取第一个根节点作为主题
      const firstNode = sanitizedData.tree[0] || { id: 'root', title: '思维导图', children: [] };
      
      // 递归转换节点格式
      const convertNode = (node: any, index = 0) => {
        if (!node) return null;
        
        // 构建符合Mind-Elixir要求的节点
        const mindNode = {
          id: String(node.id || `node-${index}-${Math.random().toString(36).substr(2, 5)}`),
          topic: String(node.title || node.text || node.topic || '节点'),
          expanded: true,
          children: []
        };
        
        // 处理子节点
        if (node.children && Array.isArray(node.children) && node.children.length > 0) {
          mindNode.children = node.children
            .filter((child: any) => child)
            .map((child: any, idx: number) => convertNode(child, idx))
            .filter((child: any) => child); // 过滤掉null结果
        }
        
        return mindNode;
      };
      
      // 创建Mind-Elixir格式的数据结构
      return {
        nodeData: convertNode(firstNode)
      };
    }
    
    // 检查是否是节点数据（直接的根节点）
    if (sanitizedData.id && sanitizedData.topic) {
      console.log('检测到单一节点数据，构建Mind-Elixir结构');
      return {
        nodeData: ensureNodeIds(sanitizedData)
      };
    }
    
    // 处理可能缺少ID的情况（如当前的民法文件）
    if (sanitizedData.topic) {
      console.log('检测到带主题但可能缺少ID的数据，补充ID');
      
      const processedData = ensureNodeIds({
        id: 'root',
        topic: sanitizedData.topic,
        expanded: true,
        children: sanitizedData.children || []
      });
      
      return { nodeData: processedData };
    }
    
    // 其他情况，尝试从数据中提取有用信息
    console.warn('未识别的数据格式，尝试提取有用信息');
    
    // 如果数据是数组，使用第一个元素
    const sourceData = Array.isArray(sanitizedData) ? sanitizedData[0] : sanitizedData;
    
    // 构建基本的Mind-Elixir数据
    const nodeData = {
      id: 'root',
      topic: '思维导图',
      expanded: true,
      children: []
    };
    
    // 尝试找到有用的属性
    if (sourceData) {
      // ID
      if (sourceData.id) nodeData.id = String(sourceData.id);
      
      // 主题/标题
      if (sourceData.topic) nodeData.topic = String(sourceData.topic);
      else if (sourceData.title) nodeData.topic = String(sourceData.title);
      else if (sourceData.text) nodeData.topic = String(sourceData.text);
      
      // 子节点
      if (sourceData.children && Array.isArray(sourceData.children)) {
        nodeData.children = sourceData.children.map((child: any, index: number) => ({
          id: String(child.id || `node-${index}-${Math.random().toString(36).substr(2, 5)}`),
          topic: String(child.topic || child.title || child.text || '子节点'),
          expanded: true
        }));
      }
    }
    
    return { nodeData };
  } catch (error) {
    console.error('数据转换错误:', error);
    return DEFAULT_MIND_DATA;
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
      setError(null);
      
      if (!containerRef.current) {
        console.error("容器元素不存在");
        setError("容器元素不存在");
        return;
      }
      
      try {
        // 检查数据有效性
        if (!isValidData(data)) {
          console.warn('提供的数据无效，使用默认数据', data);
        }
        
        // 动态导入MindElixir
        const MindElixir = await import('mind-elixir');
        const ME = MindElixir.default;
        
        // 准备数据 - 确保转换成Mind-Elixir格式
        console.log('原始数据:', data);
        const mindElixirData = convertOpmlToMindElixir(data);
        console.log('转换后的数据:', mindElixirData);
        
        // 添加调试信息，在初始化前检查数据结构
        if (!mindElixirData || !mindElixirData.nodeData) {
          console.error('转换后的数据缺少nodeData结构', mindElixirData);
          setError('初始化失败: 数据结构无效 (缺少nodeData)');
          return;
        }
        
        if (!mindElixirData.nodeData.id) {
          console.error('根节点缺少ID', mindElixirData.nodeData);
          setError('初始化失败: 根节点缺少ID');
          return;
        }
        
        if (!mindElixirData.nodeData.topic) {
          console.error('根节点缺少主题', mindElixirData.nodeData);
          setError('初始化失败: 根节点缺少topic');
          return;
        }
        
        // 配置MindElixir选项
        const options = {
          el: containerRef.current!, // 使用断言确保非空
          direction: direction === 'right' ? 1 : 2, // 1=右侧布局, 2=中心布局
          draggable: draggable,
          contextMenu: contextMenu,
          contextMenuOption: contextMenu ? { focus: true } : undefined,
          allowUndo: editable,
          overflowHidden: false,
          mainColor: getThemeColor(theme),
          mainFontColor: '#fff',
          data: mindElixirData
        };
        
        // 创建MindElixir实例
        try {
          console.log('开始初始化MindElixir实例...');
          mindElixirRef.current = new ME(options);
          
          // 初始化思维导图
          mindElixirRef.current.init();
          console.log('MindElixir初始化成功');
          
          // 设置只读模式（如果不可编辑）
          if (!editable && mindElixirRef.current.operation) {
            mindElixirRef.current.operation.readonly();
          }
        } catch (initError) {
          console.error('MindElixir初始化失败:', initError);
          let errorMessage = initError instanceof Error ? initError.message : '未知错误';
          // 提供更详细的错误信息
          if (errorMessage.includes('undefined') && errorMessage.includes('JSON')) {
            errorMessage = `"undefined" is not valid JSON - 请检查数据格式。有效nodeData示例: { nodeData: { id: "root", topic: "主题", children: [...] } }`;
          }
          setError(`初始化失败: ${errorMessage}`);
        }
      } catch (err) {
        console.error('加载思维导图库出错:', err);
        setError(`加载失败: ${err instanceof Error ? err.message : '未知错误'}`);
      }
    };
    
    loadMindElixir();
    
    // 组件卸载时清理
    return () => {
      if (mindElixirRef.current) {
        try {
          if (mindElixirRef.current.bus) {
            mindElixirRef.current.bus.removeAllListeners();
          }
          mindElixirRef.current = null;
        } catch (e) {
          console.error('清理时出错:', e);
        }
      }
    };
  }, [data, direction, draggable, editable, contextMenu, theme, isClient]);
  
  // 根据主题名称获取颜色
  const getThemeColor = (themeName: string): string => {
    switch (themeName) {
      case 'dark':
        return '#333333';
      case 'green':
        return '#2ecc71';
      case 'purple':
        return '#9b59b6';
      case 'primary':
      default:
        return '#4a89ff';
    }
  };
  
  // 显示错误信息或思维导图容器
  return (
    <div className={`mind-elixir-container ${className}`} style={{ width, height, position: 'relative' }}>
      {error ? (
        <div className="flex flex-col items-center justify-center h-full bg-red-50 p-4 rounded-md">
          <div className="text-red-500 mb-2 font-medium">错误: {error}</div>
          <div className="text-sm text-gray-600">
            尝试刷新页面或检查数据格式。如果问题持续，请联系管理员。
          </div>
        </div>
      ) : (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      )}
    </div>
  );
};

export default MindElixirMap;
