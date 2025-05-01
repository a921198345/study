'use client'

import { useState } from 'react';
import styles from '../styles/PdfUploader.module.css';

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

    try {
      // 上传OPML文件
      setUploadProgress(30); // 上传中
      const uploadResponse = await fetch('/api/upload-opml', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || '上传失败');
      }

      setUploadProgress(60); // 上传完成

      const uploadData = await uploadResponse.json();
      
      // 处理OPML文件
      setUploadProgress(80); // 开始处理
      const processResponse = await fetch('/api/process-opml', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath: uploadData.filePath }),
      });

      // 尝试获取响应内容，无论是否成功
      let processData;
      try {
        processData = await processResponse.json();
      } catch (jsonErr) {
        throw new Error('无法解析处理结果：服务器响应格式错误');
      }

      // 检查响应状态
      if (!processResponse.ok) {
        const errorMessage = processData.error || 
                             processData.details || 
                             `处理失败 (${processResponse.status})`;
                             
        if (processData.stdout) {
          console.error('服务器输出:', processData.stdout);
        }
        
        throw new Error(errorMessage);
      }

      setResult(processData);
      setUploadProgress(100); // 处理完成
      
      // 如果提供了回调函数，则调用它
      if (typeof onUploadResult === 'function') {
        onUploadResult(processData);
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
    <div className={styles.container}>
      <div className={styles.uploadForm}>
        <h2 className={styles.title}>上传OPML思维导图</h2>
        <p className={styles.description}>
          上传OPML格式的思维导图，系统将自动解析并构建知识树结构
        </p>
        
        <div className={styles.fileInput}>
          <input 
            type="file" 
            id="opml-file" 
            accept=".opml" 
            onChange={handleFileChange} 
            disabled={uploading}
          />
          <label htmlFor="opml-file" className={styles.fileInputLabel}>
            {file ? file.name : '选择OPML文件'}
          </label>
        </div>
        
        <button 
          className={styles.uploadButton} 
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? '处理中...' : '上传并处理'}
        </button>
        
        {uploadProgress > 0 && (
          <div className={styles.progressContainer}>
            <div 
              className={styles.progressBar} 
              style={{ width: `${uploadProgress}%` }}
            ></div>
            <span className={styles.progressText}>{getProgressText(uploadProgress)}</span>
          </div>
        )}
        
        {error && (
          <div className={styles.error}>
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
        <div className={styles.resultContainer}>
          <h3 className={styles.resultTitle}>处理结果</h3>
          <div className={styles.resultInfo}>
            <p><strong>状态：</strong> {result.success ? '成功' : '失败'}</p>
            {result.success ? (
              <>
                <p><strong>节点数量：</strong> {result.nodeCount || 0}</p>
                <p><strong>源文件：</strong> {result.filePath?.split('/').pop() || '未知'}</p>
                <p><strong>输出路径：</strong> {result.outputPath?.split('/').pop() || '未知'}</p>
                
                <div className={styles.treePreview}>
                  <h4>知识树预览 (顶级节点)：</h4>
                  {result.tree && result.tree.length > 0 ? (
                    <div className={styles.nodeInfo}>
                      {result.tree.map((node, index) => (
                        <div key={node.id || index} className="mb-2">
                          <p><strong>标题：</strong> {node.title || '未命名'}</p>
                          <p><strong>子节点数：</strong> {node.children?.length || 0}</p>
                          {index < result.tree.length - 1 && <hr className="my-2 border-gray-300" />}
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