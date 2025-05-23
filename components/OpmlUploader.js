'use client'

import { useState } from 'react';

export default function OpmlUploader({ onUploadResult }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
      setUploadProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('请先选择OPML文件');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.opml')) {
      setError('请上传OPML格式的文件');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(10); // 开始上传

    // 创建FormData对象
    const formData = new FormData();
    formData.append('file', file);
    formData.append('makeActive', 'true'); // 默认设置为活跃文件

    try {
      // 使用新的API端点上传OPML文件
      setUploadProgress(30); // 上传中
      const uploadResponse = await fetch('/api/admin/upload-opml', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || '上传失败');
      }

      setUploadProgress(70); // 上传完成

      const uploadData = await uploadResponse.json();
      
      // 直接使用上传API返回的结果，无需再调用process-opml
      setUploadProgress(100); // 处理完成
      
      setResult({
        success: uploadData.success,
        nodeCount: uploadData.fileInfo?.nodesCount || 0,
        filePath: uploadData.fileInfo?.name || '未知',
        outputPath: uploadData.fileInfo?.id || '未知',
        tree: [
          {
            title: uploadData.fileInfo?.name || '思维导图',
            id: uploadData.fileInfo?.id || 'root',
            children: []
          }
        ]
      });
      
      // 如果提供了回调函数，则调用它
      if (typeof onUploadResult === 'function') {
        onUploadResult(uploadData);
      }
    } catch (err) {
      console.error('上传或处理过程中出错:', err);
      setError(err.message || '上传或处理过程中出错');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  // 根据进度返回描述文本
  const getProgressText = (progress) => {
    if (progress === 0) return '';
    if (progress < 30) return '准备上传文件...';
    if (progress < 60) return '上传OPML文件中...';
    if (progress < 80) return '上传完成，准备处理...';
    if (progress < 100) return '正在处理OPML文件，构建知识树...';
    return '处理完成！';
  };

  return (
    <div className="w-full max-w-screen-lg mx-auto">
      <div className="bg-white rounded-lg p-6 shadow-md mb-5">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">上传OPML思维导图</h2>
        <p className="text-gray-600 mb-5">
          上传OPML格式的思维导图，系统将自动解析并构建知识树结构
        </p>
        
        <div className="mb-4">
          <input 
            type="file" 
            id="opml-file" 
            accept=".opml" 
            onChange={handleFileChange} 
            disabled={uploading}
            className="absolute w-0 h-0 opacity-0"
          />
          <label htmlFor="opml-file" className="block p-3 bg-gray-100 border border-dashed border-gray-300 rounded-md cursor-pointer text-center text-gray-700 hover:bg-gray-200 transition whitespace-nowrap overflow-hidden text-ellipsis">
            {file ? file.name : '选择OPML文件'}
          </label>
        </div>
        
        <button 
          className="px-5 py-2.5 bg-blue-500 text-white rounded-md font-medium cursor-pointer transition hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? '处理中...' : '上传并处理'}
        </button>
        
        {uploadProgress > 0 && (
          <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
            <span className="block mt-2 text-sm text-gray-600">{getProgressText(uploadProgress)}</span>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            <p><strong>错误：</strong> {error}</p>
            {error.includes('处理结果') && (
              <div className="mt-2 text-sm">
                <p>建议尝试：</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>确认上传的是有效的OPML格式文件</li>
                  <li>检查OPML文件的编码是否为UTF-8</li>
                  <li>尝试使用其他思维导图软件导出OPML文件</li>
                  <li>如果问题持续存在，请联系管理员</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      
      {result && (
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">处理结果</h3>
          <div className="text-gray-700">
            <p><strong>状态：</strong> {result.success ? '成功' : '失败'}</p>
            {result.success ? (
              <>
                <p><strong>节点数量：</strong> {result.nodeCount || 0}</p>
                <p><strong>源文件：</strong> {result.filePath?.split('/').pop() || '未知'}</p>
                <p><strong>输出路径：</strong> {result.outputPath?.split('/').pop() || '未知'}</p>
                
                <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-3">知识树预览 (顶级节点)：</h4>
                  {result.tree && result.tree.length > 0 ? (
                    <div className="max-h-72 overflow-y-auto pr-2">
                      {result.tree.map((node, index) => (
                        <div key={node.id || index} className="mb-2">
                          <p><strong>标题：</strong> {node.title || '未命名'}</p>
                          <p><strong>子节点数：</strong> {node.children?.length || 0}</p>
                          {index < result.tree.length - 1 && <hr className="my-2 border-gray-200" />}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>没有找到节点</p>
                  )}
                </div>
              </>
            ) : (
              <p><strong>错误：</strong> {result.error || '未知错误'}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 