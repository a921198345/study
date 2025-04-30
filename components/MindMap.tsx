'use client'

import React, { useCallback, useState } from 'react';
import Tree from 'react-d3-tree';
import type { RawNodeDatum } from 'react-d3-tree';

type MindMapProps = {
  data: any;
  highlightNodeId?: string;
  onNodeClick?: (nodeData: any) => void;
  zoom?: number;
};

// 将项目JSON格式转换为react-d3-tree格式
const convertDataFormat = (data: any): RawNodeDatum => {
  return {
    name: data.title,
    attributes: {
      id: data.id,
      content: data.content || '',
      level: data.level || 0,
    },
    children: data.children?.map(convertDataFormat) || [],
  };
};

export const MindMap: React.FC<MindMapProps> = ({ 
  data, 
  highlightNodeId, 
  onNodeClick,
  zoom = 1
}) => {
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
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
  
  // 转换数据格式
  const treeData = data ? convertDataFormat(data) : null;
  
  // 自定义节点组件
  const renderCustomNode = ({ nodeDatum, toggleNode }: any) => {
    const isHighlighted = nodeDatum.attributes.id === highlightNodeId;
    const level = nodeDatum.attributes.level || 0;
    
    return (
      <g 
        onClick={toggleNode}
        className="node-container"
        data-testid={`node-${nodeDatum.attributes.id}`}
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
          {nodeDatum.name.length > 30 
            ? `${nodeDatum.name.substring(0, 27)}...` 
            : nodeDatum.name}
        </text>
        
        {nodeDatum.attributes.content && (
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
  };

  // 处理组件挂载和尺寸变化
  const containerRef = useCallback((containerElem: HTMLDivElement) => {
    if (containerElem !== null) {
      const { width, height } = containerElem.getBoundingClientRect();
      setDimensions({ width, height });
      setTranslate({ x: width / 2, y: height / 5 });
    }
  }, []);

  if (!treeData) {
    return <div>无数据</div>;
  }

  return (
    <div className="h-full w-full relative" ref={containerRef}>
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
    </div>
  );
}; 