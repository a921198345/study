'use client'

import React, { useCallback, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// 动态导入Tree组件，避免SSR问题
const Tree = dynamic(() => import('react-d3-tree').then(mod => mod.default), { 
  ssr: false,
  loading: () => <div className="text-white text-center p-4">加载思维导图组件...</div>
});

type RawNodeDatum = {
  name: string;
  attributes?: Record<string, any>;
  children?: RawNodeDatum[];
};

type MindMapProps = {
  data: any;
  highlightNodeId?: string;
  onNodeClick?: (nodeData: any) => void;
  zoom?: number;
};

// 将项目JSON格式转换为react-d3-tree格式
const convertDataFormat = (data: any): RawNodeDatum => {
  if (!data) return { name: '无数据' };
  
  try {
    return {
      name: data.title || '未命名节点',
      attributes: {
        id: data.id || 'unknown',
        content: data.content || '',
        level: data.level || 0,
      },
      children: Array.isArray(data.children) 
        ? data.children.map(convertDataFormat) 
        : [],
    };
  } catch (error) {
    console.error('数据转换错误:', error);
    return { name: '数据错误' };
  }
};

export const MindMap: React.FC<MindMapProps> = ({ 
  data, 
  highlightNodeId, 
  onNodeClick,
  zoom = 1
}) => {
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 确保仅在客户端渲染
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // 根据节点层级获取颜色
  const getNodeColor = (level: number) => {
    const colors = [
      '#5C73F2', // 根节点
      '#FF6B6B', // 一级节点
      '#29C279', // 二级节点
      '#FFAB4C', // 三级节点
      '#B476E5', // 四级节点
    ];
    
    return colors[Math.min(level, colors.length - 1)];
  };
  
  // 转换数据格式，添加错误处理
  let treeData = null;
  try {
    treeData = data ? convertDataFormat(data) : null;
  } catch (err) {
    console.error('思维导图数据转换错误:', err);
    setError('数据格式错误，无法显示思维导图');
  }
  
  // 自定义节点组件
  const renderCustomNode = ({ nodeDatum, toggleNode }: any) => {
    try {
      const isHighlighted = nodeDatum.attributes?.id === highlightNodeId;
      const level = nodeDatum.attributes?.level || 0;
      
      return (
        <g 
          onClick={toggleNode}
          className="node-container"
          data-testid={`node-${nodeDatum.attributes?.id}`}
        >
          <circle 
            r={isHighlighted ? 18 : 15} 
            fill={isHighlighted ? '#FF6B6B' : getNodeColor(level)}
            className="node-circle"
            strokeWidth={isHighlighted ? 2 : 0}
            stroke={isHighlighted ? '#FFF' : 'none'}
          />
          <text 
            fill="white" 
            strokeWidth="0" 
            x="20"
            dy="0.35em"
            className={`text-sm ${isHighlighted ? 'font-bold' : 'font-medium'}`}
          >
            {nodeDatum.name && nodeDatum.name.length > 30 
              ? `${nodeDatum.name.substring(0, 27)}...` 
              : nodeDatum.name || '未命名'}
          </text>
          
          {nodeDatum.attributes?.content && (
            <foreignObject
              width="200"
              height="50"
              x="20"
              y="15"
              className="node-content"
              style={{ opacity: 0.8 }}
            >
              <div
                className="bg-gray-800 text-gray-300 text-xs p-1 rounded shadow"
              >
                {nodeDatum.attributes.content.slice(0, 50)}
                {nodeDatum.attributes.content.length > 50 && '...'}
              </div>
            </foreignObject>
          )}
        </g>
      );
    } catch (err) {
      console.error('节点渲染错误:', err);
      return <g><text fill="red">节点错误</text></g>;
    }
  };

  // 处理组件挂载和尺寸变化
  const containerRef = useCallback((containerElem: HTMLDivElement) => {
    if (containerElem !== null) {
      try {
        const { width, height } = containerElem.getBoundingClientRect();
        setDimensions({ width, height });
        setTranslate({ x: width / 2, y: height / 5 });
      } catch (err) {
        console.error('容器尺寸计算错误:', err);
      }
    }
  }, []);

  // 显示错误信息
  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-800 text-white">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  // 只在客户端渲染，避免SSR问题
  if (!isClient) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-800">
        <div className="text-white">正在初始化思维导图...</div>
      </div>
    );
  }

  if (!treeData) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-800">
        <div className="text-white">无数据</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative" ref={containerRef}>
      {isClient && (
        <Tree
          data={treeData}
          orientation="vertical"
          translate={translate}
          renderCustomNodeElement={renderCustomNode}
          onNodeClick={onNodeClick}
          zoom={zoom}
          separation={{ siblings: 1.5, nonSiblings: 2 }}
          pathFunc="straight"
        />
      )}
    </div>
  );
}; 