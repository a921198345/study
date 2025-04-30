'use client'

import { SimpleMindMap } from '@/components/SimpleMindMap'

export default function SimpleMinMapPage() {
  // 使用硬编码的数据，完全避免任何数据加载
  const staticData = {
    id: "root",
    title: "民法典",
    level: 0,
    children: [
      {
        id: "child1",
        title: "总则编",
        level: 1,
        children: [
          {
            id: "grandchild1",
            title: "民事权利能力",
            level: 2,
            children: []
          },
          {
            id: "grandchild2",
            title: "民事行为能力",
            level: 2,
            children: []
          }
        ]
      },
      {
        id: "child2",
        title: "物权编",
        level: 1,
        children: [
          {
            id: "grandchild3",
            title: "所有权",
            level: 2,
            children: []
          }
        ]
      }
    ]
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">简化版思维导图</h1>
      <div className="border rounded-lg p-4" style={{ minHeight: '600px' }}>
        <SimpleMindMap data={staticData} />
      </div>
    </div>
  )
} 