'use client'

import React from 'react';

type NodeData = {
  id: string;
  title: string;
  level?: number;
  children?: NodeData[];
};

interface SimpleMindMapProps {
  data: NodeData;
}

export function SimpleMindMap({ data }: SimpleMindMapProps) {
  // 递归渲染节点及其子节点
  const renderNode = (node: NodeData, level = 0) => {
    const levelColors = [
      '#5C73F2', // 根节点
      '#FF6B6B', // 一级节点
      '#29C279', // 二级节点
      '#FFAB4C', // 三级节点
      '#B476E5', // 四级节点
    ];
    
    const nodeColor = levelColors[Math.min(level, levelColors.length - 1)];
    
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
          {node.title}
        </div>
        
        {node.children && node.children.length > 0 && (
          <div className="children">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="simple-mindmap" style={{ padding: '20px', overflowY: 'auto', height: '100%' }}>
      {renderNode(data)}
    </div>
  );
} 