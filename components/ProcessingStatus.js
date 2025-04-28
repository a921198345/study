'use client'

import { useState, useEffect } from 'react';

export default function ProcessingStatus() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasProcessingFiles, setHasProcessingFiles] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // 添加完整的URL以确保请求正确发送
      const API_URL = window.location.origin + '/api/get-process-logs';
      console.log('正在请求日志API:', API_URL);
      
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        // 添加超时
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error(`获取日志失败: ${response.status}`);
      }
      
      const data = await response.json();
      setLogs(data.logs || []);
      
      // 检查是否有处理中的文件
      setHasProcessingFiles(data.logs && data.logs.some(log => log.includes('[处理中]')));
      
      // 请求成功，重置重试计数
      setRetryCount(0);
      setError(null);
    } catch (err) {
      console.error('获取日志出错:', err);
      
      // 设置友好的错误消息
      let errorMessage = err.message || '网络错误';
      if (errorMessage === 'Failed to fetch') {
        errorMessage = '无法连接到服务器，请检查网络连接';
      } else if (errorMessage.includes('AbortError')) {
        errorMessage = '请求超时，服务器响应过慢';
      }
      
      setError(errorMessage);
      
      // 如果是网络错误，增加重试计数
      if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
        setRetryCount(prev => prev + 1);
      }
      
      // 回退到默认值
      if (retryCount > 3) {
        setLogs(["获取日志失败，将在稍后重试...", "请尝试刷新页面或检查服务器状态"]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // 如果有处理中的文件，每2秒更新一次，否则每10秒更新一次
    const interval = setInterval(() => {
      fetchLogs();
    }, hasProcessingFiles ? 2000 : 10000);
    
    return () => clearInterval(interval);
  }, [hasProcessingFiles]);
  
  // 添加重试机制 - 如果连续失败自动在短时间内重试
  useEffect(() => {
    if (retryCount > 0 && retryCount <= 3) {
      const retryTimeout = setTimeout(() => {
        console.log(`第${retryCount}次重试获取日志...`);
        fetchLogs();
      }, 2000 * retryCount); // 逐渐增加重试间隔
      
      return () => clearTimeout(retryTimeout);
    }
  }, [retryCount]);

  // 根据日志类型设置不同的样式
  const getLogStyle = (log) => {
    if (log.includes('[ERROR]')) return 'text-red-400';
    if (log.includes('[START]')) return 'text-blue-400 font-bold';
    if (log.includes('[COMPLETE]')) return 'text-green-400 font-bold';
    if (log.includes('[STATS]')) return 'text-purple-400';
    if (log.includes('[处理中]')) return 'text-yellow-400 animate-pulse';
    if (log.includes('===== ')) return 'text-gray-400 font-bold mt-2';
    return 'text-gray-300';
  };

  return (
    <div className="mt-6 w-full">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">处理状态</h2>
          <button 
            onClick={fetchLogs}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            刷新
          </button>
        </div>
        
        {loading && logs.length === 0 && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
            <p className="font-medium">获取日志出错: {error}</p>
            <p className="text-sm mt-1 text-red-300">系统将自动重试连接</p>
          </div>
        )}
        
        {hasProcessingFiles && (
          <div className="bg-yellow-900 border-l-4 border-yellow-500 p-4 mb-4 rounded-r">
            <div className="flex">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 102 0V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-200">
                  文件处理中，请稍候...
                </p>
                <div className="mt-2 w-full bg-gray-700 rounded-full h-2.5">
                  <div className="bg-yellow-500 h-2.5 rounded-full w-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-gray-900 text-green-300 font-mono text-sm p-4 rounded-md shadow-inner overflow-auto max-h-96 border border-gray-700">
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={index} className={`${getLogStyle(log)} mb-1`}>
                {log}
              </div>
            ))
          ) : (
            <div className="text-gray-500 italic">暂无处理日志</div>
          )}
        </div>
      </div>
    </div>
  );
} 