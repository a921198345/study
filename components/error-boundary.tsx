'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('组件错误:', error);
    console.error('错误详情:', errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // 自定义降级UI
      return this.props.fallback || (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
          <h2 className="text-lg font-semibold text-red-600">组件加载出错</h2>
          <p className="text-sm text-red-500 mt-1">
            {this.state.error?.message || '发生了未知错误'}
          </p>
          <button
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm"
            onClick={() => this.setState({ hasError: false })}
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 