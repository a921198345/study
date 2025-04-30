'use client'

import React from 'react';

type NodeData = {
  id: string | number;
  title: string;
  level?: number;
  parentId?: number | null;
  children?: NodeData[] | (string | number)[];
};

interface SimpleMindMapProps {
  data: NodeData;
}

export function SimpleMindMap({ data }: SimpleMindMapProps) {
  // 展平包含节点ID引用的数据结构
  const flattenData = (rootData: NodeData, allNodes: NodeData[]) => {
    // 如果children是数字/字符串ID数组，将其转换为实际节点对象
    if (rootData.children && rootData.children.length > 0 && typeof rootData.children[0] !== 'object') {
      // 找到对应ID的节点
      const childNodes = (rootData.children as (string | number)[])
        .map(id => allNodes.find(node => node.id === id))
        .filter(node => node !== undefined) as NodeData[];
      
      return {
        ...rootData,
        children: childNodes
      };
    }
    
    return rootData;
  };
  
  // 递归渲染节点及其子节点
  const renderNode = (node: NodeData, allNodes: NodeData[], level = 0) => {
    const levelColors = [
      '#5C73F2', // 根节点
      '#FF6B6B', // 一级节点
      '#29C279', // 二级节点
      '#FFAB4C', // 三级节点
      '#B476E5', // 四级节点
    ];
    
    const nodeColor = levelColors[Math.min(level, levelColors.length - 1)];
    
    // 处理节点数据，确保children包含实际节点而不是ID
    const processedNode = flattenData(node, allNodes);
    
    return (
      <div key={node.id} className="node-container" style={{ marginLeft: level * 40 + 'px' }}>
        <div 
          className="node" 
          style={{ 
            background: nodeColor,
            padding: '8px 12px',
            borderRadius: '8px',
            color: 'white',
            margin: '10px 0',
            display: 'inline-block'
          }}
        >
          {node.title || "未命名节点"}
        </div>
        
        {processedNode.children && processedNode.children.length > 0 && (
          <div className="children">
            {(processedNode.children as NodeData[]).map(child => renderNode(child, allNodes, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // 获取所有节点的平面数组（如果数据是数组形式）
  const allNodes = Array.isArray(data) ? data : [data];
  
  // 渲染根节点或数组的第一个节点
  return (
    <div className="simple-mindmap" style={{ padding: '20px', overflowY: 'auto', height: '100%' }}>
      {Array.isArray(data) 
        ? (data.length > 0 ? renderNode(data[0], allNodes) : <div>没有数据</div>)
        : renderNode(data, allNodes)}
    </div>
  );
} 