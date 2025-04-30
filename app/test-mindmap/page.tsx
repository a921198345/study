'use client'

import { useEffect, useState } from 'react'
import { SimpleMindMap } from '@/components/SimpleMindMap'

export default function TestMindMapPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // 尝试加载测试数据
        const response = await fetch('/data/test-mindmap.json')
        if (!response.ok) {
          throw new Error(`加载失败: ${response.status}`)
        }
        const jsonData = await response.json()
        setData(jsonData)
      } catch (err: any) {
        console.error('加载错误:', err)
        setError(err.message || '未知错误')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])
  
  if (loading) {
    return <div>加载中...</div>
  }
  
  if (error) {
    return <div>错误: {error}</div>
  }
  
  // 显示JSON数据，验证数据是否正确加载
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <h1>测试思维导图</h1>
      
      {/* 首先显示原始JSON，验证数据加载 */}
      <div style={{ marginBottom: '20px', padding: '10px', background: '#f5f5f5', overflowX: 'auto' }}>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
      
      {/* 使用简化版的思维导图组件 */}
      {data && data[0] && (
        <div style={{ flexGrow: 1, border: '1px solid #ccc', overflow: 'auto' }}>
          <SimpleMindMap data={data[0]} />
        </div>
      )}
    </div>
  )
} 