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
  Popconfirm 
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

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/opml-files');
      if (!response.ok) throw new Error('获取文件列表失败');
      const data = await response.json();
      setFiles(data.files);
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
      
      messageApi.success('活跃文件设置成功');
      fetchFiles(); // 刷新文件列表
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
      
      messageApi.success('文件删除成功');
      fetchFiles(); // 刷新文件列表
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
        messageApi.success(`${info.file.name} 上传成功`);
        fetchFiles(); // 刷新文件列表
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

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {contextHolder}
      
      <Typography>
        <Title level={2}>思维导图管理</Title>
        <Paragraph>
          在此页面上传和管理OPML格式的思维导图文件。上传后的文件将自动转换为适用于思维导图显示的格式。
        </Paragraph>
      </Typography>
      
      <div className="my-6">
        <Dragger {...uploadProps} disabled={uploading}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽OPML文件到此区域上传</p>
          <p className="ant-upload-hint">
            仅支持单个OPML格式文件，文件大小不超过10MB
          </p>
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
    </div>
  );
};

export default MindMapManagement; 