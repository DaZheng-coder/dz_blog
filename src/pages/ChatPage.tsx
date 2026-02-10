import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TMessage } from "../types/chat";
import { MessageList } from "../components/MessageList";
import { MessageInput } from "../components/MessageInput";
import { sendChatMessage } from "../services/alibabaService";
import { resumeConfig, generateSystemPrompt } from "../config/resume";

/**
 * AI 智能简历对话页面
 * AI 扮演求职者，面试官通过对话了解求职者
 */
export function ChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 使用简历配置
  const { basicInfo, aiPersonality } = resumeConfig;
  const systemPrompt = generateSystemPrompt(resumeConfig);

  /**
   * 处理发送消息（面试官提问）
   */
  const handleSendMessage = async (content: string) => {
    // 创建面试官消息
    const interviewerMessage: TMessage = {
      id: `interviewer-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, interviewerMessage]);
    setIsLoading(true);

    try {
      // 调用 AI API，AI 扮演求职者回答
      const candidateResponse = await sendChatMessage(
        [...messages, interviewerMessage],
        systemPrompt
      );

      // 创建求职者回复消息（AI 扮演）
      const candidateMessage: TMessage = {
        id: `candidate-${Date.now()}`,
        role: "assistant",
        content: candidateResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, candidateMessage]);
    } catch (error) {
      console.error("发送消息失败:", error);

      // 添加错误提示
      const errorMessage: TMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "抱歉，我现在无法回答您的问题。请稍后再试，或者换个方式提问。",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理清空对话
   */
  const handleClearChat = () => {
    if (window.confirm("确定要重新开始面试对话吗？")) {
      setMessages([]);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* 顶部导航栏 */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800 text-white shadow-lg flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{aiPersonality.avatar}</div>
              <div>
                <h1 className="text-lg font-bold">来与我对话吧！</h1>
                <p className="text-xs text-blue-100">
                  {basicInfo.name} - {basicInfo.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/")}
                className="cursor-pointer hover:scale-105 text-black px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 text-sm font-medium flex items-center gap-1.5"
                title="返回首页"
              >
                <span>🏠</span>
                <span className="hidden sm:inline">首页</span>
              </button>

              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  className="cursor-pointer hover:scale-105 text-black px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200 text-sm font-medium flex items-center gap-1.5"
                >
                  <span>🔄</span>
                  <span className="hidden sm:inline">重新开始</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 - 居中布局 */}
      <div className="flex-1 overflow-hidden flex justify-center">
        <div className="w-full max-w-4xl flex flex-col">
          {/* 消息滚动区域 */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {/* 欢迎提示 */}
            {messages.length === 0 && !isLoading && (
              <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3">
                  👋 欢迎来到我的 AI 智能对话
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  我是 <strong>{basicInfo.name}</strong>，一名{" "}
                  <strong>{basicInfo.title}</strong>。
                </p>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  这是一个由 AI
                  驱动的互动对话系统。您可以向我提问，我会以第一人称回答您的问题，让您更全面地了解我的工作经历、技能和项目经验。
                </p>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    💡 您可以问我：
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• 请介绍一下你自己</li>
                    <li>• 你有哪些工作经历？</li>
                    <li>• 你最擅长什么技术？</li>
                    <li>• 能讲讲你做过的项目吗？</li>
                    <li>• 你的优势是什么？</li>
                    <li>• 你为什么想换工作？</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 消息列表 */}
            <MessageList messages={messages} isLoading={isLoading} />
          </div>

          {/* 消息输入区域 - 固定在底部但在中间区域内 */}
          <div className="flex-shrink-0 border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl mb-6">
            <div className="px-4 py-4">
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={isLoading}
                placeholder={`向 ${basicInfo.name} 提问...`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
