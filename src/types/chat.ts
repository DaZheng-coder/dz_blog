/**
 * 对话相关类型定义
 */

// 消息角色类型
export type TMessageRole = "user" | "assistant" | "system";

// 消息类型
export type TMessage = {
  id: string;
  role: TMessageRole;
  content: string;
  timestamp: Date;
};

// 角色扮演配置
export type TCharacterConfig = {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  avatar?: string;
};

// API 请求参数
export type TChatRequest = {
  messages: Array<{
    role: TMessageRole;
    content: string;
  }>;
  model?: string;
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
};

// API 响应类型
export type TChatResponse = {
  id: string;
  choices: Array<{
    message: {
      role: TMessageRole;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

// 流式响应事件
export type TStreamEvent = {
  type: "start" | "chunk" | "end" | "error";
  content?: string;
  error?: string;
};
