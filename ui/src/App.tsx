import React from 'react';
import { ConfigProvider, DatePicker, message } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import 'antd/dist/antd.css';
import { Home } from './pages/home';

export
function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      componentSize="small">
      <div className="App">
        <Home />
      </div>
    </ConfigProvider>
  );
}
