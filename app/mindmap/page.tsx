'use client'

import { useEffect, useState, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ZoomIn, ZoomOut, ArrowLeft, Home, Search } from 'lucide-react'
// 重命名导入的Next.js Error组件以避免冲突
import NextError from 'next/error'
import { SimpleMindMap } from '@/components/SimpleMindMap'

// 错误边界组件
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<{ message?: string } | null>(null);

  // 在客户端捕获错误
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('全局错误捕获:', error);
      setHasError(true);
      setError(error.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white flex-col">
        <h2 className="text-2xl text-red-400 mb-4">思维导图加载失败</h2>
        <p className="text-gray-300 mb-2">错误信息: {error?.message || '未知错误'}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          重新加载
        </button>
      </div>
    );
  }

  return children;
}

function MindMapContent() {
  const [mindmapData, setMindmapData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const highlightNodeId = searchParams?.get('node')
  
  // 获取思维导图数据
  useEffect(() => {
    async function fetchMindMapData() {
      try {
        setLoading(true)
        // 改用新的简化版民法思维导图数据文件
        console.log('开始加载思维导图数据...');
        const response = await fetch(`/data/simple-mindmap.json`, {
          cache: 'no-store', // 禁用缓存，确保每次都获取最新数据
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          console.error('加载失败状态码:', response.status);
          // 使用全局Error构造函数，而不是Next.js的Error组件
          throw new globalThis.Error(`思维导图数据加载失败: ${response.status} ${response.statusText}`)
        }
        
        console.log('JSON响应获取成功，开始解析...');
        const data = await response.json()
        console.log('JSON解析成功，设置数据...');
        setMindmapData(data)
      } catch (err: any) {
        console.error('Error fetching mindmap:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchMindMapData()
  }, [])
  
  // 处理缩放
  const handleZoomIn = useCallback(() => setZoom(prev => Math.min(prev + 0.2, 2)), [])
  const handleZoomOut = useCallback(() => setZoom(prev => Math.max(prev - 0.2, 0.5)), [])
  
  // 处理搜索
  const handleSearch = useCallback(() => {
    if (!searchTerm.trim() || !mindmapData) {
      setSearchResults([]);
      return;
    }
    
    const results: any[] = [];
    
    const searchNode = (node: any) => {
      if (node?.title?.toLowerCase().includes(searchTerm.toLowerCase())) {
        results.push({
          id: node.id,
          title: node.title
        });
      }
      
      if (node?.children) {
        node.children.forEach(searchNode);
      }
    };
    
    if (mindmapData && mindmapData[0]) {
      searchNode(mindmapData[0]);
    }
    setSearchResults(results);
  }, [searchTerm, mindmapData]);
  
  // 高亮搜索结果节点
  const handleHighlightNode = useCallback((nodeId: string) => {
    router.push(`/mindmap?node=${nodeId}`);
  }, [router]);
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <div className="text-xl">加载思维导图中...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <div className="text-xl text-red-400">加载失败: {error}</div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* 导航栏 */}
      <div className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-gray-300 hover:text-white"
          >
            <ArrowLeft className="mr-2" size={16} />
            返回
          </button>
          <button 
            onClick={() => router.push('/')}
            className="flex items-center text-gray-300 hover:text-white"
          >
            <Home className="mr-2" size={16} />
            首页
          </button>
        </div>
        <h1 className="text-xl font-bold">
          {mindmapData && mindmapData[0] ? mindmapData[0].title : '思维导图'}
        </h1>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleZoomOut}
            className="p-1 bg-gray-700 rounded hover:bg-gray-600"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-sm">{Math.round(zoom * 100)}%</span>
          <button 
            onClick={handleZoomIn}
            className="p-1 bg-gray-700 rounded hover:bg-gray-600"
          >
            <ZoomIn size={16} />
          </button>
        </div>
      </div>
      
      {/* 搜索栏 */}
      <div className="bg-gray-800 p-2 border-b border-gray-700">
        <div className="flex max-w-md mx-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索节点..."
            className="flex-1 px-3 py-1 bg-gray-700 border border-gray-600 rounded-l text-white"
          />
          <button
            onClick={handleSearch}
            className="px-3 py-1 bg-blue-600 rounded-r flex items-center"
          >
            <Search size={16} className="mr-1" />
            搜索
          </button>
        </div>
      </div>
      
      {/* 搜索结果 */}
      {searchResults.length > 0 && (
        <div className="bg-gray-800 border-b border-gray-700 p-2">
          <div className="max-w-md mx-auto">
            <div className="text-sm text-gray-300 mb-1">找到 {searchResults.length} 个相关节点：</div>
            <div className="max-h-32 overflow-y-auto">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  onClick={() => handleHighlightNode(result.id)}
                  className="p-1 text-sm cursor-pointer hover:bg-gray-700 rounded"
                >
                  {result.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* 思维导图区域 */}
      <div className="flex-1 relative overflow-auto">
        {mindmapData && mindmapData[0] && (
          <SimpleMindMap data={mindmapData[0]} />
        )}
      </div>
    </div>
  )
}

// 主页面组件，使用Suspense和错误边界包裹
export default function MindMapPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-gray-900 text-white">加载中...</div>}>
        <MindMapContent />
      </Suspense>
    </ErrorBoundary>
  )
} 