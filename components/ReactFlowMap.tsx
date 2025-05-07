'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  ReactFlowProvider,
  NodeTypes,
  ConnectionLineType,
  MarkerType,
  Node,
  Edge,
  NodeProps,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

// 默认思维导图数据
const DEFAULT_MIND_DATA = {
  nodeData: {
    id: 'root',
    topic: '思维导图',
    expanded: true,
    children: []
  }
};

// 自定义节点组件
const CustomNode = ({ data, isConnectable }: NodeProps) => {
  // 根据层级调整样式
  const color = data.level === 0 ? '#ff9500' : 
               data.level === 1 ? '#9b59b6' : 
               data.level === 2 ? '#2ecc71' : 
               data.level === 3 ? '#3498db' : '#f39c12';
  
  // 根据层级调整节点大小和字体大小
  const nodeStyles = {
    background: data.style?.background || color,
    minWidth: data.level === 0 ? '200px' : 
              data.level === 1 ? '180px' : 
              data.level === 2 ? '150px' : '120px',
    maxWidth: data.level === 0 ? '300px' : 
              data.level === 1 ? '280px' : 
              data.level === 2 ? '250px' : '200px',
    fontSize: data.level === 0 ? '18px' : 
              data.level === 1 ? '16px' : 
              data.level === 2 ? '14px' : '12px',
    color: data.style?.color || 'white',
    fontWeight: data.level === 0 ? 'bold' : 
                data.level === 1 ? 'bold' : 'normal',
    textAlign: 'center' as const,
    lineHeight: '1.3',
    padding: data.level === 0 ? '12px 16px' : 
             data.level === 1 ? '10px 14px' : 
             data.level === 2 ? '8px 12px' : '6px 10px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    border: '2px solid transparent',
    borderColor: data.style?.borderColor || 'transparent',
    overflowWrap: 'break-word' as const,
    wordBreak: 'break-word' as const,
    opacity: data.level > 3 ? 0.9 : 1,
  };

  return (
    <div
      className="shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
      style={nodeStyles}
    >
      {data.label}
    </div>
  );
};

// 定义节点类型
const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

// 节点数据结构接口
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
    borderColor?: string;
  };
}

// 自定义节点数据接口
interface CustomNodeData {
  label: string;
  level: number;
  style?: {
    background?: string;
    color?: string;
    fontSize?: string;
    borderColor?: string;
  };
}

// 主题颜色接口
interface ThemeColors {
  root: string;
  level1: string;
  level2: string;
  level3: string;
  default: string;
  background: string;
  edge: string;
}

// 组件属性接口
interface ReactFlowMapProps {
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

// 节点位置接口
interface NodePosition {
  x: number;
  y: number;
}

// 验证数据的格式
const isValidData = (data: any): boolean => {
  if (!data) {
    console.warn('ReactFlowMap: 数据为null或undefined');
    return false;
  }
  
  if (typeof data !== 'object') {
    console.warn(`ReactFlowMap: 数据不是对象类型，而是 ${typeof data}`);
    return false;
  }
  
  console.log('ReactFlowMap: 数据对象结构:', Object.keys(data));
  
  // 允许nodeData结构
  if (data.nodeData && typeof data.nodeData === 'object') {
    // 输出节点数据信息以便调试
    console.log(`ReactFlowMap: 检测到nodeData结构，ID=${data.nodeData.id}, 主题=${data.nodeData.topic?.substring(0, 30)}`);
    
    // 检查节点结构基本完整性
    if (!data.nodeData.id) {
      console.warn('ReactFlowMap: nodeData缺少ID');
      return false;
    }
    
    if (!data.nodeData.topic) {
      console.warn('ReactFlowMap: nodeData缺少topic');
      return false;
    }
    
    return true;
  }
  
  // 允许直接节点结构
  if (data.id && data.topic) {
    console.log(`ReactFlowMap: 检测到单节点结构，ID=${data.id}, 主题=${data.topic?.substring(0, 30)}`);
    return true;
  }
  
  // 允许topic结构（不完整但可以修复）
  if (data.topic) {
    console.log(`ReactFlowMap: 检测到不完整节点结构，主题=${data.topic?.substring(0, 30)}`);
    return true;
  }
  
  console.warn('ReactFlowMap: 无效的数据结构:', data);
  return false;
};

// 将Mind Elixir格式转换为ReactFlow格式
const convertToReactFlow = (
  data: any, 
  themeColors: ThemeColors, 
  direction: 'right' | 'side' = 'right'
): { nodes: Node[]; edges: Edge[] } => {
  console.log('ReactFlowMap: 开始数据转换...');
  
  // 如果没有有效数据，使用默认数据
  if (!isValidData(data)) {
    console.warn('ReactFlowMap: 提供的数据无效，使用默认数据');
    data = DEFAULT_MIND_DATA;
  }

  // 确保我们有正确的数据格式
  let rootNode;
  
  if (data.nodeData) {
    rootNode = data.nodeData;
    console.log('ReactFlowMap: 使用nodeData结构');
  } else if (data.topic) {
    rootNode = data;
    console.log('ReactFlowMap: 使用单节点结构');
  } else {
    rootNode = DEFAULT_MIND_DATA.nodeData;
    console.log('ReactFlowMap: 使用默认数据结构');
  }

  // 确保rootNode有ID
  if (!rootNode.id) {
    rootNode.id = 'root';
    console.log('ReactFlowMap: 为根节点添加默认ID');
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // 计算最大层级深度以调整布局
  const calculateMaxDepth = (node: any, currentDepth: number = 0): number => {
    if (!node || !node.children || !Array.isArray(node.children) || node.children.length === 0) {
      return currentDepth;
    }
    
    let maxChildDepth = currentDepth;
    for (const child of node.children) {
      const childDepth = calculateMaxDepth(child, currentDepth + 1);
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    }
    
    return maxChildDepth;
  };
  
  const maxDepth = calculateMaxDepth(rootNode);
  console.log(`ReactFlowMap: 思维导图最大深度: ${maxDepth}`);
  
  // 递归处理节点
  const processNode = (node: any, parentId: string | null = null, level: number = 0, position = { x: 0, y: 0 }, dir: string = 'right') => {
    if (!node) {
      console.warn('ReactFlowMap: 处理空节点');
      return;
    }
    
    // 确保节点有ID
    const id = String(node.id || `node-${Math.random().toString(36).substr(2, 9)}`);
    
    // 确保节点有标题
    const label = node.topic || node.text || node.label || '节点';
    
    console.log(`ReactFlowMap: 处理节点 ID=${id}, 标题=${label.substring(0, 20)}, 级别=${level}`);
    
    // 根据主题获取颜色
    const nodeStyle = {
      background: level === 0 ? themeColors.root :
                 level === 1 ? themeColors.level1 :
                 level === 2 ? themeColors.level2 :
                 level === 3 ? themeColors.level3 : themeColors.default
    };
    
    // 添加节点
    nodes.push({
      id,
      type: 'custom',
      position,
      data: { 
        label, 
        level,
        style: { ...nodeStyle, ...(node.style || {}) }
      },
      style: {
        width: 'auto',
        height: 'auto',
      },
    });
    
    // 如果有父节点，添加连接边
    if (parentId) {
      edges.push({
        id: `e-${parentId}-${id}`,
        source: parentId,
        target: id,
        type: 'smoothstep',
        animated: false,
        style: { 
          stroke: themeColors.edge, 
          strokeWidth: level === 1 ? 3 : 2,
          opacity: 0.8
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
          color: themeColors.edge,
        },
      });
    }
    
    // 处理子节点 - 使用计算的间距
    if (node.children && Array.isArray(node.children)) {
      const childCount = node.children.length;
      console.log(`ReactFlowMap: 处理节点 ${id} 的 ${childCount} 个子节点`);
      
      // 根据层级和子节点数量动态调整间距
      const horizontalSpacing = level === 0 ? 350 : 
                               level === 1 ? 300 : 
                               level === 2 ? 250 : 200;
      
      const verticalSpacing = 50 + (Math.min(childCount, 10) * 10);
      
      // 根据子节点总高度计算起始Y坐标
      const totalHeight = (childCount - 1) * verticalSpacing;
      const startY = position.y - totalHeight / 2;
      
      node.children
        .filter((child: any) => child) // 过滤空子节点
        .forEach((child: any, index: number) => {
          let childPosition;
          
          if (dir === 'right' || (dir === 'side' && level % 2 === 0)) {
            // 右侧布局 或 side模式下的偶数层级
            childPosition = {
              x: position.x + horizontalSpacing,
              y: startY + (index * verticalSpacing)
            };
          } else {
            // side模式下的奇数层级
            childPosition = {
              x: position.x - horizontalSpacing,
              y: startY + (index * verticalSpacing)
            };
          }
          
          processNode(child, id, level + 1, childPosition, dir);
        });
    }
  };
  
  // 从根节点开始处理
  try {
    console.log('ReactFlowMap: 开始从根节点处理');
    processNode(rootNode, null, 0, { x: 200, y: 300 }, direction);
    console.log(`ReactFlowMap: 处理完成，生成 ${nodes.length} 个节点和 ${edges.length} 条边`);
  } catch (error) {
    console.error('ReactFlowMap: 处理节点时出错:', error);
  }
  
  return { nodes, edges };
};

// 根据主题获取颜色
const getThemeColors = (themeName: string = 'primary'): ThemeColors => {
  switch (themeName) {
    case 'dark':
      return {
        root: '#333333',
        level1: '#8E44AD',
        level2: '#27AE60',
        level3: '#2C3E50',
        default: '#7F8C8D',
        background: '#192734',
        edge: '#aaaaaa'
      };
    case 'green':
      return {
        root: '#16A085',
        level1: '#2ECC71',
        level2: '#27AE60',
        level3: '#1ABC9C',
        default: '#29B765',
        background: '#EAFAF1',
        edge: '#16A085'
      };
    case 'purple':
      return {
        root: '#8E44AD',
        level1: '#9B59B6',
        level2: '#884EA0',
        level3: '#A569BD',
        default: '#BB8FCE',
        background: '#F5EEF8',
        edge: '#8E44AD'
      };
    case 'primary':
    default:
      return {
        root: '#FF9500',
        level1: '#9B59B6',
        level2: '#2ECC71',
        level3: '#3498DB',
        default: '#F39C12',
        background: '#F7FAFC',
        edge: '#3498DB'
      };
  }
};

// 主组件
const ReactFlowMap: React.FC<ReactFlowMapProps> = ({
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
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CustomNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [themeColors, setThemeColors] = useState<ThemeColors>(getThemeColors(theme));
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [currentDirection, setCurrentDirection] = useState(direction);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // 确保在客户端渲染
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // 监听主题变化
  useEffect(() => {
    if (theme !== currentTheme) {
      console.log(`ReactFlowMap: 主题变更 ${currentTheme} -> ${theme}`);
      setCurrentTheme(theme);
      const newColors = getThemeColors(theme);
      setThemeColors(newColors);
      
      // 应用新主题颜色到现有节点和边
      if (nodes.length > 0) {
        // 更新节点颜色
        const updatedNodes = nodes.map((node) => {
          const nodeData = node.data;
          const level = nodeData.level;
          const nodeColor = level === 0 ? newColors.root :
                           level === 1 ? newColors.level1 :
                           level === 2 ? newColors.level2 :
                           level === 3 ? newColors.level3 : newColors.default;
                           
          return {
            ...node,
            data: {
              ...nodeData,
              style: {
                ...nodeData.style,
                background: nodeColor
              }
            }
          };
        });
        
        setNodes(updatedNodes);
        
        // 更新连接线颜色
        const updatedEdges = edges.map((edge) => ({
          ...edge,
          style: {
            ...edge.style,
            stroke: newColors.edge
          },
          markerEnd: {
            ...edge.markerEnd,
            color: newColors.edge
          }
        }));
        
        setEdges(updatedEdges);
      }
    }
  }, [theme, currentTheme, nodes, edges, setNodes, setEdges]);
  
  // 监听方向变化
  useEffect(() => {
    if (direction !== currentDirection && isClient) {
      console.log(`ReactFlowMap: 方向变更 ${currentDirection} -> ${direction}`);
      setCurrentDirection(direction);
      refreshLayout();
    }
  }, [direction, currentDirection, isClient]);
  
  // 初始化节点和边缘
  useEffect(() => {
    if (!isClient) return;
    
    try {
      console.log('ReactFlowMap: 处理思维导图数据...');
      
      // 将数据转换为ReactFlow格式
      const { nodes: flowNodes, edges: flowEdges } = convertToReactFlow(data, themeColors, direction);
      
      // 设置节点和边缘
      setNodes(flowNodes);
      setEdges(flowEdges);
      
      console.log('ReactFlowMap: 思维导图数据处理完成，节点数:', flowNodes.length);
    } catch (err) {
      console.error('ReactFlowMap: 初始化思维导图出错:', err);
      setError('初始化思维导图时出错，请检查数据格式');
    }
  }, [data, isClient, setNodes, setEdges, themeColors, direction]);
  
  // 处理节点点击
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('ReactFlowMap: 点击节点:', node);
    // 可以在这里添加节点点击处理逻辑，如高亮或展开/折叠
  }, []);
  
  // 刷新布局
  const refreshLayout = useCallback(() => {
    try {
      console.log('ReactFlowMap: 刷新布局...');
      const { nodes: flowNodes, edges: flowEdges } = convertToReactFlow(data, themeColors, currentDirection);
      setNodes(flowNodes);
      setEdges(flowEdges);
      console.log('ReactFlowMap: 布局刷新完成');
    } catch (err) {
      console.error('ReactFlowMap: 刷新布局出错:', err);
      setError('刷新布局时出错，请检查数据格式');
    }
  }, [data, themeColors, currentDirection, setNodes, setEdges]);
  
  if (!isClient) {
    return null;
  }
  
  // 设置背景颜色
  const bgColor = themeColors.background;
  
  return (
    <div className={`react-flow-container ${className}`} style={{ 
      width, height, position: 'relative',
      backgroundColor: bgColor,
      transition: 'background-color 0.3s ease'
    }}>
      {error ? (
        <div className="flex flex-col items-center justify-center h-full bg-red-50 p-4 rounded-md">
          <div className="text-red-500 mb-2 font-medium">错误: {error}</div>
          <div className="text-sm text-gray-600">
            尝试刷新页面或检查数据格式。如果问题持续，请联系管理员。
          </div>
          <button 
            onClick={refreshLayout}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            尝试重新加载
          </button>
        </div>
      ) : (
        <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-right"
              connectionLineType={ConnectionLineType.SmoothStep}
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              minZoom={0.1}
              maxZoom={4}
              nodesConnectable={editable}
              nodesDraggable={draggable}
              elementsSelectable={true}
              proOptions={{ hideAttribution: true }}
            >
              <Background 
                color={theme === 'dark' ? '#555' : '#aaa'} 
                gap={24} 
                size={1.5} 
              />
              <Controls 
                showInteractive={true} 
                className="shadow-lg bg-white/90 dark:bg-gray-800/90"
              />
              <Panel position="top-right">
                <div className="flex gap-2">
                  <button
                    onClick={refreshLayout}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded shadow-md transition-colors"
                  >
                    重新布局
                  </button>
                  <button
                    onClick={() => {
                      setNodes((nds) =>
                        nds.map((node) => ({
                          ...node,
                          position: { ...node.position }
                        }))
                      );
                    }}
                    className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded shadow-md transition-colors"
                  >
                    刷新
                  </button>
                </div>
              </Panel>
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      )}
    </div>
  );
};

export default ReactFlowMap; 