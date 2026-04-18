/**
 * React 应用入口 (main.tsx)
 * 这是当前唯一的前端入口。
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';

// 确保 root 元素存在
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found in HTML');
}

// 挂载 React 应用
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

console.log('[React] Application mounted successfully');
