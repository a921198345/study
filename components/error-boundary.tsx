'use client'

import React, { ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Typography } from 'antd';

const { Text, Title } = Typography;

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 更新状态，下次渲染时显示错误UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 记录错误信息
    console.error('组件错误：', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // 自定义错误UI
      return this.props.fallback || (
        <div className="error-boundary-container p-4">
          <Alert
            type="error"
            message={
              <Title level={4}>组件加载错误</Title>
            }
            description={
              <div>
                <Text>发生了一个错误，导致组件无法正常渲染。</Text>
                <div className="my-2">
                  <Text type="danger">{this.state.error?.message}</Text>
                </div>
                <div className="mt-4">
                  <Button type="primary" onClick={this.handleReset}>
                    重试
                  </Button>
                </div>
              </div>
            }
            showIcon
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 