'use client'

import { useState, useRef, useEffect } from 'react';

export default function PdfUploader() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingLogs, setProcessingLogs] = useState([]);
  const [knowledgeTreePreview, setKnowledgeTreePreview] = useState([]);
  const fileInputRef = useRef(null);

  // 添加获取处理日志的功能
  const fetchProcessingLogs = async () => {
    if (!uploading && !result) return; // 只在上传或有结果时获取日志
    
    try {
      const response = await fetch(`${window.location.origin}/api/get-process-logs`);
      if (response.ok) {
        const data = await response.json();
        setProcessingLogs(data.logs || []);
      }
    } catch (err) {
      console.error('获取处理日志出错:', err);
    }
  };

  // 定期获取处理日志
  useEffect(() => {
    if (uploading || result) {
      fetchProcessingLogs();
      
      const interval = setInterval(() => {
        fetchProcessingLogs();
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [uploading, result]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
      setResult(null); // 清除之前的结果
      setProcessingLogs([]); // 清除之前的日志
      setKnowledgeTreePreview([]); // 清除之前的知识树预览
      setUploadProgress(0);
    } else if (selectedFile) {
      setFile(null);
      setError('请选择PDF文件');
    }
  };

  const handleFileButtonClick = () => {
    // 通过引用手动触发文件选择器点击
    fileInputRef.current.click();
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('请选择文件');
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      setProcessingLogs([]); // 清除之前的日志
      setKnowledgeTreePreview([]); // 清除之前的知识树预览
      setUploadProgress(10); // 开始上传
      
      // 创建FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // 上传文件
      setUploadProgress(30); // 上传中
      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `上传失败 (${response.status})`);
      }
      
      const data = await response.json();
      setUploadProgress(60); // 上传完成
      setResult(data);
      
      // 处理文件
      if (data.filePath) {
        setUploadProgress(80); // 开始处理
        const processResponse = await fetch('/api/process-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filePath: data.filePath }),
        });
        
        if (!processResponse.ok) {
          const errorData = await processResponse.json();
          throw new Error(errorData.error || `处理失败 (${processResponse.status})`);
        }
        
        const processData = await processResponse.json();
        setUploadProgress(100); // 处理完成
        
        if (processData.success) {
          setResult(prev => ({ ...prev, processing: processData }));
          
          // 如果有顶级知识点，预览它们
          if (processData.topLevelNodes && processData.topLevelNodes.length > 0) {
            setKnowledgeTreePreview(processData.topLevelNodes);
          }
          
          // 如果有完整知识树数据，保存起来
          if (processData.knowledgeTree) {
            setResult(prev => ({ 
              ...prev, 
              processing: {
                ...processData,
                // 只保留前100个节点用于预览，避免数据过大
                knowledgeTree: processData.knowledgeTree.slice(0, 100)
              } 
            }));
          }
        } else {
          throw new Error(processData.error || '处理PDF时出错');
        }
        
        // 最后一次获取处理日志
        await fetchProcessingLogs();
      }
      
    } catch (err) {
      console.error('上传或处理出错:', err);
      setError(err.message);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700 dark-mode-fix">
      <h2 className="text-2xl font-bold mb-4 text-white dark-mode-heading">上传PDF知识树</h2>
      
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2 dark-mode-text">
            选择PDF文件:
          </label>
          <div className="flex items-center">
            {/* 隐藏原始文件输入，但保持功能性 */}
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />
            {/* 添加自定义按钮 */}
            <button 
              type="button"
              onClick={handleFileButtonClick}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md border border-blue-700 transition duration-200 focus:ring-2 focus:ring-blue-400 dark-mode-button"
            >
              选择文件
            </button>

            {/* 显示已选文件的简单信息 */}
            <div className="ml-3 flex-1">
              {file ? (
                <span className="text-sm text-gray-300 dark-mode-text">
                  {file.name} ({Math.round(file.size / 1024)} KB)
                </span>
              ) : (
                <span className="text-sm text-gray-400 dark-mode-text">未选择文件</span>
              )}
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={!file || uploading}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-600 dark-mode-button font-bold text-lg"
        >
          {uploading ? '处理中...' : '上传并处理'}
        </button>
      </form>
      
      {uploading && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-300 mb-1 dark-mode-text">
            <span>{getProgressText(uploadProgress)}</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
              style={{width: `${uploadProgress}%`}}
            ></div>
          </div>
          
          {/* 添加处理过程显示 */}
          <div className="mt-4 p-3 bg-gray-900 border border-blue-700 rounded-md">
            <p className="font-medium text-blue-400 mb-2">处理进行中...</p>
            {processingLogs.length > 0 && (
              <div className="max-h-40 overflow-y-auto bg-black text-green-400 p-2 rounded text-xs font-mono">
                {processingLogs.map((log, index) => (
                  <div key={index} className={`mb-1 ${getLogStyle(log)}`}>
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-900 text-red-200 rounded-md border border-red-700">
          <p className="font-medium">上传出错</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {result && !uploading && (
        <div className="mt-4 p-4 bg-gray-900 border border-green-700 rounded-md">
          <div className="flex items-center mb-2">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="font-medium text-green-400">文件上传成功!</p>
          </div>
          
          <div className="text-sm text-gray-300 mt-2">
            <p>文件名: <span className="font-medium">{result.fileName}</span></p>
            <p>大小: <span className="font-medium">{Math.round(result.size / 1024)} KB</span></p>
            <p className="text-xs text-gray-400">路径: {result.filePath}</p>
          </div>
          
          {result.processing && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="font-medium text-gray-200 mb-2">处理结果:</p>
              <div className="bg-gray-800 p-3 rounded-md border border-gray-700 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-gray-400">页数:</p>
                    <p className="font-medium text-white">{result.processing.pageCount || '未知'} 页</p>
                  </div>
                  <div>
                    <p className="text-gray-400">知识点数:</p>
                    <p className="font-medium text-white">{result.processing.nodeCount || 0} 个</p>
                  </div>
                </div>
                
                {/* 顶级知识点预览 */}
                {knowledgeTreePreview.length > 0 && (
                  <div className="mt-3">
                    <p className="text-gray-400 mb-1">顶级知识点预览:</p>
                    <ul className="list-disc pl-5 text-xs text-gray-300 max-h-40 overflow-y-auto">
                      {knowledgeTreePreview.map((node) => (
                        <li key={node.id} className="mb-1">
                          <div className="font-medium text-blue-300">{node.title}</div>
                          {node.sectionNumber && 
                            <div className="text-xs text-gray-400">编号: {node.sectionNumber}</div>
                          }
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* 如果没有知识点，显示一条消息 */}
                {(!knowledgeTreePreview || knowledgeTreePreview.length === 0) && result.processing.success && (
                  <div className="mt-3">
                    <p className="text-yellow-400">未检测到明确的知识点结构。请检查PDF格式是否符合要求。</p>
                  </div>
                )}
                
                {/* 知识树下载链接 */}
                {result.processing.outputPath && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-gray-400 mb-1">知识树JSON文件:</p>
                    <a 
                      href={`/api/download?path=${encodeURIComponent(result.processing.outputPath)}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block mt-1 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      下载知识树数据
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 显示处理日志 */}
          {processingLogs.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="font-medium text-gray-200 mb-2">处理日志:</p>
              <div className="max-h-40 overflow-y-auto bg-black text-green-400 p-2 rounded text-xs font-mono">
                {processingLogs.map((log, index) => (
                  <div key={index} className={`mb-1 ${getLogStyle(log)}`}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 根据进度返回文本描述
function getProgressText(progress) {
  if (progress < 30) return '准备上传文件...';
  if (progress < 60) return '上传文件中...';
  if (progress < 80) return '提交处理请求...';
  if (progress < 100) return 'PDF处理中...';
  return '处理完成!';
}

// 根据日志内容设置不同的样式
function getLogStyle(log) {
  if (log.includes('[ERROR]')) return 'text-red-400';
  if (log.includes('[START]')) return 'text-blue-400 font-bold';
  if (log.includes('[COMPLETE]')) return 'text-green-400 font-bold';
  if (log.includes('[STATS]')) return 'text-purple-400';
  if (log.includes('[处理中]')) return 'text-yellow-400 animate-pulse';
  if (log.includes('===== ')) return 'text-gray-400 font-bold mt-2';
  return '';
} 