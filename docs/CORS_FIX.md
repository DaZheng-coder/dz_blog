# CORS 问题修复文档

## 问题描述

在浏览器中直接调用阿里云百炼 API 时，会遇到 CORS (跨域资源共享) 错误：

```
Access to fetch at 'https://dashscope.aliyuncs.com/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 问题原因

1. **浏览器安全策略**: 浏览器的同源策略阻止前端直接访问不同域名的 API
2. **API 服务器限制**: 阿里云百炼 API 服务器未设置允许跨域访问的响应头
3. **开发环境**: 本地开发服务器 (localhost:5173) 与 API 服务器 (dashscope.aliyuncs.com) 不同源

## 解决方案

### 方案一：Vite 开发代理（已实施）✅

通过 Vite 的代理功能，在开发环境中转发 API 请求，避免 CORS 问题。

#### 1. 配置 Vite 代理

**文件**: `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 代理阿里云百炼 API 请求
      '/api/alibaba': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/alibaba/, ''),
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
})
```

**配置说明**:
- `target`: 目标 API 服务器地址
- `changeOrigin`: 修改请求头中的 origin，使其看起来像是从目标服务器发出的
- `rewrite`: 重写路径，去掉 `/api/alibaba` 前缀
- `secure`: 支持 HTTPS
- `configure`: 添加日志，便于调试

#### 2. 修改 API 服务

**文件**: `src/services/alibabaService.ts`

```typescript
// 使用代理路径避免 CORS 问题
// 开发环境使用 Vite 代理，生产环境需要配置服务器代理
const API_BASE_URL =
  import.meta.env.MODE === "development"
    ? "/api/alibaba/api/v1/services/aigc/text-generation/generation"
    : "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";
```

**工作原理**:

1. **开发环境** (`MODE === "development"`):
   - 请求发送到: `/api/alibaba/api/v1/services/aigc/text-generation/generation`
   - Vite 代理拦截请求
   - 代理将请求转发到: `https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation`
   - 响应返回给浏览器
   - ✅ 没有 CORS 问题（因为请求看起来是同源的）

2. **生产环境** (`MODE === "production"`):
   - 直接使用完整 URL
   - 需要在生产服务器配置代理

#### 3. 流式请求也需要使用代理

```typescript
// 使用代理 URL 避免 CORS
const proxyUrl =
  import.meta.env.MODE === "development"
    ? "/api/alibaba/api/v1/services/aigc/text-generation/generation"
    : "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";

const response = await fetch(proxyUrl, {
  method: "POST",
  headers: { /* ... */ },
  body: JSON.stringify(requestBody),
});
```

## 请求流程图

### 之前（有 CORS 问题）

```
浏览器 (localhost:5173)
    ↓ 直接请求
    ↓ https://dashscope.aliyuncs.com/api/...
    ↓
❌ CORS 错误：不同源
```

### 之后（使用代理）

```
浏览器 (localhost:5173)
    ↓ 请求
    ↓ /api/alibaba/api/...（同源）
    ↓
Vite 代理服务器 (localhost:5173)
    ↓ 转发请求
    ↓ https://dashscope.aliyuncs.com/api/...
    ↓
阿里云 API 服务器
    ↓ 响应
    ↓
Vite 代理服务器
    ↓ 返回响应
    ↓
✅ 浏览器（无 CORS 问题）
```

## 生产环境部署

### 方案一：Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # 代理阿里云 API
    location /api/alibaba/ {
        proxy_pass https://dashscope.aliyuncs.com/;
        proxy_set_header Host dashscope.aliyuncs.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 移除路径前缀
        rewrite ^/api/alibaba/(.*) /$1 break;
    }
}
```

### 方案二：Node.js 服务器代理

```javascript
// server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// 静态文件
app.use(express.static('dist'));

// API 代理
app.use('/api/alibaba', createProxyMiddleware({
  target: 'https://dashscope.aliyuncs.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/alibaba': '',
  },
}));

app.listen(3000);
```

### 方案三：Vercel/Netlify 配置

**vercel.json**:
```json
{
  "rewrites": [
    {
      "source": "/api/alibaba/:path*",
      "destination": "https://dashscope.aliyuncs.com/:path*"
    }
  ]
}
```

**netlify.toml**:
```toml
[[redirects]]
  from = "/api/alibaba/*"
  to = "https://dashscope.aliyuncs.com/:splat"
  status = 200
  force = true
```

## 验证修复

### 1. 检查代理配置

启动开发服务器后，查看终端输出：

```bash
npm run dev
```

发送请求时应该看到代理日志：
```
Sending Request: POST /api/alibaba/api/v1/services/aigc/text-generation/generation
Received Response: 200 /api/alibaba/api/v1/services/aigc/text-generation/generation
```

### 2. 检查浏览器网络请求

打开浏览器开发者工具 → Network 标签：

- ✅ 请求 URL: `http://localhost:5173/api/alibaba/...`（同源）
- ✅ 状态码: 200
- ✅ 无 CORS 错误

### 3. 检查控制台

浏览器控制台应该：
- ✅ 无 CORS 错误信息
- ✅ 可以看到 API 响应数据

## 常见问题

### Q1: 代理不工作？

**检查清单**:
1. ✅ 确认已重启开发服务器
2. ✅ 确认 `vite.config.ts` 配置正确
3. ✅ 确认 API 路径使用了代理前缀 `/api/alibaba`
4. ✅ 查看终端是否有代理错误日志

### Q2: 生产环境 CORS 错误？

**原因**: 生产环境没有配置代理

**解决方案**:
1. 配置 Nginx/Apache 反向代理
2. 使用 Node.js 服务器代理
3. 使用云平台的重写规则（Vercel/Netlify）

### Q3: 代理请求超时？

**可能原因**:
- 网络连接问题
- API 服务器响应慢
- 代理配置的 timeout 太短

**解决方案**:
```typescript
proxy: {
  '/api/alibaba': {
    target: 'https://dashscope.aliyuncs.com',
    timeout: 60000, // 增加超时时间
    // ...
  }
}
```

### Q4: 如何调试代理？

**启用详细日志**:
```typescript
configure: (proxy, _options) => {
  proxy.on('proxyReq', (proxyReq, req, _res) => {
    console.log('→ Request:', req.method, req.url);
    console.log('  Headers:', proxyReq.getHeaders());
  });
  proxy.on('proxyRes', (proxyRes, req, _res) => {
    console.log('← Response:', proxyRes.statusCode, req.url);
    console.log('  Headers:', proxyRes.headers);
  });
  proxy.on('error', (err, _req, _res) => {
    console.error('✗ Proxy Error:', err);
  });
}
```

## 其他 CORS 解决方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **开发代理** | 简单、无需后端 | 仅开发环境 | 本地开发 ✅ |
| **后端代理** | 安全、可控 | 需要后端服务 | 生产环境 ✅ |
| **CORS 头** | 直接、高效 | 需要 API 服务器支持 | API 可控时 |
| **JSONP** | 兼容性好 | 仅支持 GET、不安全 | 不推荐 ❌ |

## 安全注意事项

1. **不要在前端暴露 API Key**
   - ✅ 使用环境变量
   - ✅ 不要提交到 Git

2. **生产环境使用 HTTPS**
   - ✅ 确保代理使用 HTTPS
   - ✅ 验证 SSL 证书

3. **限制代理访问**
   - ✅ 只代理必要的路径
   - ✅ 添加请求验证
   - ✅ 设置请求频率限制

## 相关文件

- `vite.config.ts` - Vite 代理配置
- `src/services/alibabaService.ts` - API 服务（使用代理路径）
- `.env.local` - 环境变量配置

## 参考资源

- [Vite 服务器选项文档](https://vitejs.dev/config/server-options.html#server-proxy)
- [MDN CORS 文档](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS)
- [http-proxy-middleware 文档](https://github.com/chimurai/http-proxy-middleware)

---

**修复日期**: 2026-02-10  
**状态**: ✅ 已完成  
**测试**: 待用户验证
