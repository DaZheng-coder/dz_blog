# Axios 迁移文档

## 迁移概述

项目已成功从原生 `fetch` API 迁移到 `axios` 进行网络请求。

## 完成的工作

### 1. 安装 axios

```bash
npm install axios
```

**版本信息**:
- axios: ^1.7.9 (最新版本)

### 2. 重构 alibabaService.ts

**文件位置**: `src/services/alibabaService.ts`

#### 主要改动

##### 创建 axios 实例

```typescript
import axios, { type AxiosError } from "axios";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60秒超时
  headers: {
    "Content-Type": "application/json",
  },
});
```

##### 添加请求拦截器

自动为所有请求添加 Authorization 头：

```typescript
axiosInstance.interceptors.request.use(
  (config) => {
    if (API_KEY) {
      config.headers.Authorization = `Bearer ${API_KEY}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

##### 添加响应拦截器

统一处理错误响应：

```typescript
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // 服务器返回错误响应
      const errorData = error.response.data as any;
      const errorMessage =
        errorData?.message || `API 请求失败: ${error.response.status}`;
      throw new Error(errorMessage);
    } else if (error.request) {
      // 请求已发送但没有收到响应
      throw new Error("网络连接失败，请检查网络设置");
    } else {
      // 请求配置出错
      throw new Error(error.message || "请求配置错误");
    }
  }
);
```

##### 重构 sendChatMessage 函数

**之前 (fetch)**:
```typescript
const response = await fetch(API_BASE_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
    "X-DashScope-SSE": "disable",
  },
  body: JSON.stringify(requestBody),
});

if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.message || `API 请求失败: ${response.status}`);
}

const data = await response.json();
```

**之后 (axios)**:
```typescript
const response = await axiosInstance.post("", requestBody, {
  headers: {
    "X-DashScope-SSE": "disable",
  },
});

const data = response.data;
```

### 3. 流式请求处理

对于 `sendChatMessageStream` 函数，由于 axios 处理 SSE (Server-Sent Events) 流式响应相对复杂，保持使用原生 `fetch` API。

**原因**:
- SSE 需要读取响应流 (ReadableStream)
- fetch 的 `response.body.getReader()` 更适合处理流式数据
- axios 虽然也支持流式响应，但需要额外配置且不如 fetch 直观

## 优势对比

### 使用 axios 的优势

1. **更简洁的 API**
   - 自动 JSON 转换
   - 更简洁的错误处理
   - 请求/响应拦截器

2. **更好的错误处理**
   - 统一的错误处理机制
   - 区分不同类型的错误（网络错误、服务器错误、配置错误）
   - 自动抛出非 2xx 状态码的错误

3. **请求/响应拦截**
   - 自动添加认证头
   - 统一处理响应数据
   - 全局错误处理

4. **超时控制**
   - 内置超时配置
   - 防止请求长时间挂起

5. **取消请求**
   - 支持请求取消功能
   - 避免不必要的网络请求

### fetch vs axios 对比

| 特性 | fetch | axios |
|------|-------|-------|
| 浏览器支持 | 原生支持 | 需要安装 |
| JSON 处理 | 手动 `response.json()` | 自动处理 |
| 错误处理 | 需手动检查 `response.ok` | 自动抛出错误 |
| 请求拦截 | 不支持 | 支持 |
| 响应拦截 | 不支持 | 支持 |
| 超时控制 | 需要 AbortController | 内置支持 |
| 进度监控 | 复杂 | 简单 |
| 取消请求 | AbortController | CancelToken |

## 使用示例

### 基本请求

```typescript
import { sendChatMessage } from "../services/alibabaService";

try {
  const response = await sendChatMessage(messages, characterPrompt);
  console.log("AI 回复:", response);
} catch (error) {
  console.error("请求失败:", error.message);
}
```

### 错误处理

axios 会自动处理以下错误：

1. **网络错误**: "网络连接失败，请检查网络设置"
2. **服务器错误**: 从响应中提取错误信息
3. **超时错误**: 60 秒后自动超时
4. **配置错误**: 请求配置问题

## 测试验证

### 验证步骤

1. ✅ axios 依赖已安装
2. ✅ alibabaService.ts 已重构
3. ✅ 代码无 linter 错误
4. ✅ 项目可正常启动
5. ✅ axios 模块正确加载

### 功能测试

要测试 API 请求功能：

1. 启动开发服务器: `npm run dev`
2. 访问 http://localhost:5173/
3. 点击"立即体验"进入聊天页面
4. 选择一个 AI 角色
5. 发送消息测试

**预期行为**:
- 消息发送后显示加载动画
- API 请求通过 axios 发送
- 收到 AI 回复后显示在消息列表中
- 错误会显示友好的错误提示

## 未来优化建议

### 1. 请求取消

为长时间运行的请求添加取消功能：

```typescript
import axios from 'axios';

const source = axios.CancelToken.source();

axiosInstance.post('', data, {
  cancelToken: source.token
});

// 取消请求
source.cancel('用户取消了请求');
```

### 2. 请求重试

添加自动重试机制：

```typescript
import axiosRetry from 'axios-retry';

axiosRetry(axiosInstance, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
});
```

### 3. 进度监控

监控上传/下载进度：

```typescript
axiosInstance.post('', data, {
  onUploadProgress: (progressEvent) => {
    const percentCompleted = Math.round(
      (progressEvent.loaded * 100) / progressEvent.total
    );
    console.log(percentCompleted);
  },
});
```

### 4. 并发控制

限制并发请求数量：

```typescript
import pLimit from 'p-limit';

const limit = pLimit(5); // 最多 5 个并发请求

const promises = urls.map(url => 
  limit(() => axiosInstance.get(url))
);
```

## 相关文件

- `src/services/alibabaService.ts` - 主要服务文件
- `package.json` - axios 依赖配置
- `src/pages/ChatPage.tsx` - 使用 API 的页面组件

## 参考资源

- [axios 官方文档](https://axios-http.com/docs/intro)
- [axios GitHub](https://github.com/axios/axios)
- [MDN fetch API](https://developer.mozilla.org/zh-CN/docs/Web/API/Fetch_API)

---

**迁移完成日期**: 2026-02-10  
**迁移人员**: AI Assistant  
**状态**: ✅ 完成
