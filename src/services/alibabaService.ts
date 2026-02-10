/**
 * 阿里云百炼 API 服务
 * 使用 axios 进行网络请求
 */

import axios, { type AxiosError } from "axios";
import type { TMessage, TStreamEvent } from "../types/chat";

// 阿里云百炼 API 配置
const API_KEY = import.meta.env.VITE_ALIBABA_API_KEY || "";

// 使用代理路径避免 CORS 问题
// 开发环境使用 Vite 代理，生产环境需要配置服务器代理
const API_BASE_URL =
  import.meta.env.MODE === "development"
    ? "/api/alibaba/api/v1/services/aigc/text-generation/generation"
    : "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";

// 创建 axios 实例
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60秒超时
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器 - 添加 Authorization
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

// 响应拦截器 - 统一错误处理
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

/**
 * 发送对话请求到阿里云百炼 API
 * @param messages - 消息列表
 * @param characterPrompt - 角色系统提示词
 */
export async function sendChatMessage(
  messages: TMessage[],
  characterPrompt: string
): Promise<string> {
  if (!API_KEY) {
    throw new Error("请配置 VITE_ALIBABA_API_KEY 环境变量");
  }

  const requestBody = {
    model: "qwen-turbo",
    input: {
      messages: [
        {
          role: "system",
          content: characterPrompt,
        },
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
    },
    parameters: {
      result_format: "message",
    },
  };

  try {
    const response = await axiosInstance.post("", requestBody, {
      headers: {
        "X-DashScope-SSE": "disable",
      },
    });

    const data = response.data;

    if (data.output && data.output.choices && data.output.choices[0]) {
      return data.output.choices[0].message.content;
    }

    throw new Error("API 返回数据格式错误");
  } catch (error) {
    console.error("阿里云 API 调用失败:", error);
    throw error;
  }
}

/**
 * 流式发送对话请求
 * @param messages - 消息列表
 * @param characterPrompt - 角色系统提示词
 * @param onChunk - 接收流式数据的回调函数
 */
export async function sendChatMessageStream(
  messages: TMessage[],
  characterPrompt: string,
  onChunk: (event: TStreamEvent) => void
): Promise<void> {
  if (!API_KEY) {
    onChunk({ type: "error", error: "请配置 VITE_ALIBABA_API_KEY 环境变量" });
    return;
  }

  const requestBody = {
    model: "qwen-turbo",
    input: {
      messages: [
        {
          role: "system",
          content: characterPrompt,
        },
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
    },
    parameters: {
      result_format: "message",
      incremental_output: true,
    },
  };

  try {
    // 对于流式请求，使用 fetch 更方便处理 SSE
    // axios 处理 SSE 流式响应相对复杂，这里保持使用 fetch
    // 使用代理 URL 避免 CORS
    const proxyUrl =
      import.meta.env.MODE === "development"
        ? "/api/alibaba/api/v1/services/aigc/text-generation/generation"
        : "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";

    const response = await fetch(proxyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
        "X-DashScope-SSE": "enable",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      onChunk({
        type: "error",
        error: errorData.message || `API 请求失败: ${response.status}`,
      });
      return;
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      onChunk({ type: "error", error: "无法读取响应流" });
      return;
    }

    onChunk({ type: "start" });

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        onChunk({ type: "end" });
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((line) => line.trim());

      for (const line of lines) {
        if (line.startsWith("data:")) {
          const jsonStr = line.slice(5).trim();
          if (jsonStr === "[DONE]") {
            continue;
          }

          try {
            const data = JSON.parse(jsonStr);
            if (data.output?.choices?.[0]?.message?.content) {
              onChunk({
                type: "chunk",
                content: data.output.choices[0].message.content,
              });
            }
          } catch (e) {
            console.error("解析 SSE 数据失败:", e);
          }
        }
      }
    }
  } catch (error) {
    console.error("流式请求失败:", error);
    onChunk({
      type: "error",
      error: error instanceof Error ? error.message : "未知错误",
    });
  }
}
