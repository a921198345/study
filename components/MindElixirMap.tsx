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

// 安全stringify函数增强 - 在convertOpmlToMindElixir函数内
const safeStringify = (obj: any) => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    // 处理undefined值
    if (value === undefined) {
      return null; // 将undefined转换为null
    }
    
    // 处理"undefined"字符串
    if (value === "undefined") {
      return null;
    }
    
    // 处理循环引用
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  });
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
    // 在这里尝试安全序列化数据，移除undefined和循环引用
    const safeStringify = (obj: any) => {
      const seen = new WeakSet();
      return JSON.stringify(obj, (key, value) => {
        // 处理undefined值
        if (value === undefined) {
          return null; // 将undefined转换为null
        }
        
        // 处理"undefined"字符串
        if (value === "undefined") {
          return null;
        }
        
        // 处理循环引用
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }
        return value;
      });
    };
    
    let sanitizedData;
    try {
      const dataStr = safeStringify(data);
      console.log('安全序列化结果前20个字符:', dataStr.substring(0, 20) + '...');
      sanitizedData = JSON.parse(dataStr);
    } catch (jsonError) {
      console.error('数据序列化失败:', jsonError);
      console.log('序列化失败的数据类型:', typeof data);
      if (typeof data === 'object') {
        console.log('数据结构的顶层键:', Object.keys(data));
      }
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

// 在loadMindElixir函数内，在创建MindElixir实例前添加此函数
// 创建MindElixir实例前，确保没有"undefined"字符串
const sanitizeForMindElixir = (data: any): any => {
  if (!data) return null;
  
  // 如果是基础类型，直接返回
  if (typeof data !== 'object') {
    // 处理"undefined"字符串
    if (data === "undefined") return null;
    return data;
  }
  
  // 如果是数组，处理每个元素
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForMindElixir(item));
  }
  
  // 如果是对象，处理每个属性
  const result: Record<string, any> = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      // 跳过值为字符串"undefined"的属性
      if (data[key] === "undefined") {
        result[key] = null;
      } else {
        result[key] = sanitizeForMindElixir(data[key]);
      }
    }
  }
  return result;
};

// 添加这个新方法到文件顶部，在其他import之后
// 这个函数将拦截Mind-Elixir库的JSON.parse调用
function safePatchMindElixir() {
  // 保存原始的JSON.parse方法
  const originalJSONParse = JSON.parse;
  
  // 替换全局JSON.parse方法，拦截Mind-Elixir的调用
  JSON.parse = function(text: string, ...args: any[]) {
    // 检查是否包含"undefined"字符串，这是导致错误的原因
    if (typeof text === 'string' && text.includes('"undefined"')) {
      console.warn('检测到包含"undefined"的JSON字符串，进行修复');
      // 替换所有"undefined"为null
      const fixedText = text.replace(/"undefined"/g, 'null');
      return originalJSONParse(fixedText, ...args);
    }
    
    // 如果不需要特殊处理，使用原始方法
    return originalJSONParse(text, ...args);
  };
  
  return function unpatch() {
    // 恢复原始方法
    JSON.parse = originalJSONParse;
  };
}

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
        console.log('原始数据类型:', typeof data);
        console.log('原始数据是否为null:', data === null);
        console.log('原始数据是否为undefined:', data === undefined);
        
        if (typeof data === 'object' && data !== null) {
          console.log('原始数据顶层键:', Object.keys(data));
        }
        
        const mindElixirData = convertOpmlToMindElixir(data);
        
        console.log('转换后的数据结构:', 
          JSON.stringify({
            hasNodeData: Boolean(mindElixirData && mindElixirData.nodeData),
            nodeDataKeys: mindElixirData && mindElixirData.nodeData ? 
              Object.keys(mindElixirData.nodeData) : '无nodeData'
          })
        );
        
        // 确保数据结构有效
        if (!mindElixirData || typeof mindElixirData !== 'object') {
          console.error('转换后的数据不是对象', mindElixirData);
          setError('初始化失败: 数据转换结果无效');
          return;
        }
        
        // 确保nodeData存在
        if (!mindElixirData.nodeData) {
          console.error('转换后的数据缺少nodeData结构', mindElixirData);
          setError('初始化失败: 数据结构无效 (缺少nodeData)');
          return;
        }
        
        // 确保nodeData有效
        if (typeof mindElixirData.nodeData !== 'object') {
          console.error('nodeData不是对象', mindElixirData.nodeData);
          setError('初始化失败: nodeData必须是对象');
          return;
        }
        
        // 检查必要的属性
        if (!mindElixirData.nodeData.id) {
          console.error('根节点缺少ID', mindElixirData.nodeData);
          // 尝试修复
          mindElixirData.nodeData.id = 'root';
        }
        
        if (!mindElixirData.nodeData.topic) {
          console.error('根节点缺少主题', mindElixirData.nodeData);
          // 尝试修复
          mindElixirData.nodeData.topic = '思维导图';
        }
        
        if (!mindElixirData.nodeData.children) {
          console.error('根节点缺少children数组', mindElixirData.nodeData);
          // 确保有children数组
          mindElixirData.nodeData.children = [];
        }
        
        // 确保是数组
        if (!Array.isArray(mindElixirData.nodeData.children)) {
          console.error('children不是数组', mindElixirData.nodeData.children);
          mindElixirData.nodeData.children = [];
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
          data: sanitizeForMindElixir(mindElixirData) // 使用经过深度清理的数据
        };
        
        // 在创建Mind-Elixir实例前添加这行代码
        const unpatchJSON = safePatchMindElixir();
        
        try {
          // 创建Mind-Elixir实例和初始化
          mindElixirRef.current = new ME(options);
          mindElixirRef.current.init();
          console.log('MindElixir初始化成功');
          
          // 完成后恢复原始JSON.parse
          unpatchJSON();
          
        } catch (initError) {
          // 确保在发生错误时也恢复原始方法
          unpatchJSON();
          
          // 向上抛出错误以便外部错误处理
          throw initError;
        }
      } catch (err) {
        console.error('加载思维导图库出错:', err);
        
        // 添加额外的错误处理
        if (err instanceof Error && err.message.includes('undefined') && err.message.includes('JSON')) {
          console.error('检测到JSON解析错误，尝试最终的回退方案');
          
          try {
            console.log('尝试使用极简数据初始化');
            
            // 创建最简单的有效数据结构
            const absoluteMinimalData = {
              nodeData: {
                id: 'root',
                topic: '思维导图',
                expanded: true,
                children: []
              }
            };
            
            // 创建新选项对象
            const newOptions = {
              el: containerRef.current!,
              direction: direction === 'right' ? 1 : 2,
              draggable: true,
              contextMenu: false,
              allowUndo: false,
              overflowHidden: false,
              mainColor: getThemeColor(theme),
              mainFontColor: '#fff',
              data: absoluteMinimalData
            };
            
            // 再次拦截JSON.parse
            const unpatchJSON = safePatchMindElixir();
            
            try {
              // 创建新实例
              mindElixirRef.current = new ME(newOptions);
              mindElixirRef.current.init();
              console.log('使用极简数据初始化成功');
              
              // 恢复JSON.parse
              unpatchJSON();
              
              setError('原始数据有问题，已加载简化思维导图');
              return;
            } catch (minimalError) {
              console.error('极简数据初始化失败:', minimalError);
              
              // 尝试静态替代方案
              try {
                console.log('尝试使用静态HTML替代');
                if (containerRef.current) {
                  containerRef.current.innerHTML = `
                    <div style="padding: 20px; text-align: center;">
                      <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #333;">
                        思维导图 (静态版)
                      </div>
                      <div style="border: 1px solid #ddd; padding: 10px; display: inline-block; text-align: left;">
                        <ul style="list-style-type: none; padding-left: 0;">
                          <li style="margin-bottom: 8px;">• 根节点</li>
                          <li style="margin-left: 20px;">• 子节点</li>
                        </ul>
                      </div>
                    </div>
                  `;
                  setError('显示静态版思维导图');
                }
              } catch (finalError) {
                console.error('所有方法都失败:', finalError);
                setError('无法显示思维导图');
              }
            } catch (fallbackError) {
              console.error('回退方案失败:', fallbackError);
            }
          } catch (outerError) {
            console.error('回退机制初始化失败:', outerError);
            setError(`初始化失败: ${outerError instanceof Error ? outerError.message : '未知错误'}`);
          }
        }
        
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
      
      // 确保恢复原始的JSON.parse
      try {
        // 临时创建一个拦截函数并立即调用其返回的恢复函数
        // 这会确保恢复到原始的JSON.parse
        const unpatch = safePatchMindElixir();
        unpatch();
        console.log('组件卸载时已恢复原始JSON.parse');
      } catch (e) {
        console.error('恢复JSON.parse时出错:', e);
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
