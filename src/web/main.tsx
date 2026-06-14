/**
 * Web 应用入口文件
 *
 * 职责：
 * 1. 创建 React 根节点并挂载到 DOM
 * 2. 引入 BrowserRouter 提供客户端路由能力
 * 3. 引入全局样式（Tailwind CSS）
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
