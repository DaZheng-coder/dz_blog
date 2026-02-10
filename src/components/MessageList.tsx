import { type FC, useEffect, useRef } from "react";
import type { TMessage } from "../types/chat";
import { formatDate, getRelativeTime } from "../utils/formatDate";

interface IMessageListProps {
  messages: TMessage[];
  isLoading?: boolean;
}

/**
 * 消息列表组件
 * 显示对话历史记录
 */
export const MessageList: FC<IMessageListProps> = ({
  messages,
  isLoading = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-gray-400 dark:text-gray-500">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-xl font-semibold mb-2">开始您的对话</p>
          <p className="text-sm">输入消息开始聊天</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.role === "user" ? "justify-end" : "justify-start"
          } animate-fade-in`}
        >
          <div
            className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-md ${
              message.role === "user"
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-none"
                : message.role === "assistant"
                ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-none border border-gray-200 dark:border-gray-700"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            {/* 消息内容 */}
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>

            {/* 时间戳 */}
            <div
              className={`text-xs mt-2 ${
                message.role === "user"
                  ? "text-blue-100"
                  : "text-gray-400 dark:text-gray-500"
              }`}
              title={formatDate(message.timestamp)}
            >
              {getRelativeTime(message.timestamp)}
            </div>
          </div>
        </div>
      ))}

      {/* 加载动画 */}
      {isLoading && (
        <div className="flex justify-start animate-fade-in">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-md">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* 滚动锚点 */}
      <div ref={messagesEndRef} />
    </div>
  );
};
