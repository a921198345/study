'use client'

import { useState, useEffect } from 'react';
import { 
  Typography, 
  Table, 
  Button, 
  Space, 
  Upload, 
  message, 
  Spin, 
  Tag, 
  Popconfirm,
  Alert
} from 'antd';
import { 
  UploadOutlined, 
  DeleteOutlined, 
  CheckCircleOutlined, 
  EyeOutlined, 
  InboxOutlined 
} from '@ant-design/icons';
import Link from 'next/link';
import type { UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ErrorBoundary from '../../../components/error-boundary';

const { Title, Paragraph } = Typography;
const { Dragger } = Upload;

interface MindMapFile {
  id: string;
  name: string;
  uploadDate: string;
  nodeCount: number;
  isActive: boolean;
}

const MindMapManagement = () => {
  const [files, setFiles] = useState<MindMapFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [isVercel, setIsVercel] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/opml-files');
      if (!response.ok) throw new Error('获取文件列表失败');
      const data = await response.json();
      setFiles(data.files);
      
      // 检查是否在Vercel环境
      if (data.error && data.error.includes('默认文件')) {
        setIsVercel(true);
      }
    } catch (error) {
      messageApi.error('获取文件列表失败，请重试');
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleSetActive = async (fileId: string) => {
    try {
      const response = await fetch('/api/admin/set-active', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) throw new Error('设置活跃文件失败');
      
      const data = await response.json();
      
      if (data.vercel) {
        messageApi.success('活跃文件设置成功（Vercel环境模拟）');
        
        // 在Vercel环境中，直接更新UI状态
        setFiles(prevFiles => 
          prevFiles.map(file => ({
            ...file,
            isActive: file.id === fileId
          }))
        );
      } else {
        messageApi.success('活跃文件设置成功');
        fetchFiles(); // 刷新文件列表
      }
    } catch (error) {
      messageApi.error('设置活跃文件失败，请重试');
      console.error('Error setting active file:', error);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const response = await fetch('/api/admin/delete-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '删除文件失败');
      }
      
      const data = await response.json();
      
      if (data.vercel) {
        messageApi.success('文件删除成功（Vercel环境模拟）');
        
        // 在Vercel环境中，直接从UI中移除文件
        setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
      } else {
        messageApi.success('文件删除成功');
        fetchFiles(); // 刷新文件列表
      }
    } catch (error: any) {
      messageApi.error(error.message || '删除文件失败，请重试');
      console.error('Error deleting file:', error);
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    action: '/api/admin/upload-opml',
    accept: '.opml',
    showUploadList: false,
    beforeUpload: (file) => {
      const isOpml = file.name.endsWith('.opml');
      if (!isOpml) {
        messageApi.error('只能上传OPML文件！');
        return false;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        messageApi.error('文件必须小于10MB！');
        return false;
      }
      return true;
    },
    onChange: (info) => {
      if (info.file.status === 'uploading') {
        setUploading(true);
        return;
      }
      
      if (info.file.status === 'done') {
        setUploading(false);
        // 检查是否在Vercel环境中
        if (info.file.response?.vercelSimulation) {
          setIsVercel(true);
          messageApi.success({
            content: info.file.response.message || `${info.file.name} 上传成功（Vercel环境模拟）`,
            duration: 6
          });
          
          // 直接添加新上传的文件到文件列表中（临时显示）
          const newFile = info.file.response.file;
          if (newFile && newFile.id) {
            // 创建新文件对象添加到列表
            const tempFile: MindMapFile = {
              id: newFile.id,
              name: newFile.name,
              uploadDate: newFile.uploadDate,
              nodeCount: 1, // 默认节点数
              isActive: false
            };
            
            // 更新文件列表
            setFiles(prevFiles => [tempFile, ...prevFiles]);
          }
        } else {
          messageApi.success(`${info.file.name} 上传成功`);
          // 普通环境下刷新文件列表
          fetchFiles(); 
        }
      } else if (info.file.status === 'error') {
        setUploading(false);
        messageApi.error(`${info.file.name} 上传失败: ${info.file.response?.message || '未知错误'}`);
      }
    },
  };

  const columns: ColumnsType<MindMapFile> = [
    {
      title: '文件名',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          {text}
          {record.isActive && <Tag color="green">活跃</Tag>}
        </Space>
      ),
    },
    {
      title: '上传日期',
      dataIndex: 'uploadDate',
      key: 'uploadDate',
      sorter: (a, b) => new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: '节点数量',
      dataIndex: 'nodeCount',
      key: 'nodeCount',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Link href={`/mindmap?file=${record.id}`} target="_blank">
            <Button icon={<EyeOutlined />} type="link">
              预览
            </Button>
          </Link>
          
          {!record.isActive && (
            <Button 
              type="link" 
              icon={<CheckCircleOutlined />}
              onClick={() => handleSetActive(record.id)}
            >
              设为活跃
            </Button>
          )}
          
          <Popconfirm
            title="确定要删除这个文件吗？"
            description="该操作不可撤销"
            onConfirm={() => handleDeleteFile(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />}
              disabled={record.isActive}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 底部添加部署指南组件
  const DeploymentGuide = () => (
    <div className="mt-10 p-4 border border-blue-200 bg-blue-50 rounded-lg">
      <h3 className="text-lg font-bold text-blue-800 mb-2">部署与多域名问题解决指南</h3>
      <div className="text-sm text-blue-700">
        <h4 className="font-medium mb-1">1. 解决多域名问题</h4>
        <p className="mb-2">
          Vercel默认会为每次部署创建新的预览域名。建议固定使用主域名：
          <code className="bg-white px-1 rounded ml-1">study-sage-chi.vercel.app</code>
        </p>
        
        <h4 className="font-medium mb-1">2. 文件上传成功但列表不更新</h4>
        <p className="mb-2">
          上传文件后，请刷新页面查看更新。Vercel环境下文件存储在临时目录，会在应用重启后丢失。
          生产环境下建议使用持久化存储解决方案。
        </p>
        
        <h4 className="font-medium mb-1">3. 推荐部署配置</h4>
        <ul className="list-disc pl-5 mb-2">
          <li>在Vercel仪表板中，进入项目设置</li>
          <li>禁用每次提交的自动预览部署</li>
          <li>设置主域名为production环境</li>
        </ul>
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      {contextHolder}
      <div className="container mx-auto p-6 max-w-6xl">
        <Typography>
          <Title level={2}>思维导图管理</Title>
          <Paragraph>
            在此页面上传和管理OPML格式的思维导图文件。上传后的文件将自动转换为适用于思维导图显示的格式。
          </Paragraph>
        </Typography>
        
        {isVercel && (
          <Alert
            message="Vercel部署提示"
            description="在Vercel环境中，文件上传和管理功能仅作为演示，文件将不会永久保存。每次重新部署后，文件列表将重置为默认状态。"
            type="warning"
            showIcon
            className="mb-4"
          />
        )}
        
        <div className="my-6">
          <Dragger 
            {...uploadProps}
            disabled={uploading}
            className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg"
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽OPML文件到此区域上传</p>
            <p className="ant-upload-hint">
              仅支持单个OPML格式文件，文件大小不超过10MB
            </p>
            {uploading && <Spin className="mt-2" />}
          </Dragger>
        </div>
        
        <div className="my-6">
          <Spin spinning={loading}>
            <Table 
              columns={columns} 
              dataSource={files}
              rowKey="id"
              pagination={false}
              locale={{ emptyText: '暂无文件，请上传' }}
            />
          </Spin>
        </div>
        
        <DeploymentGuide />
      </div>
    </ErrorBoundary>
  );
};

export default MindMapManagement; 