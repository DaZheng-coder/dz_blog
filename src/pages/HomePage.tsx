import { useState } from "react";
import { useNavigate } from "react-router-dom";
/**
 * 首页组件
 * 展示项目介绍、技术栈特性和 AI 对话入口
 */
export function HomePage() {
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        {/* <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 dark:text-white mb-4">
            AI Blog
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            基于 React + Vite + TypeScript + TailwindCSS
          </p>
        </header> */}

        {/* Card Section */}
        <div className="max-w-2xl mx-auto">
          {/* AI 智能简历 Feature */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-2xl p-8 mb-8 text-white">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="text-6xl">👨‍💻</div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold mb-2">AI 智能对话</h2>
                <p className="text-purple-100 mb-4">
                  体验创新的 AI
                  驱动对话系统，通过对话深入了解我的工作经历和技能，快来了解我吧
                </p>
                <button
                  onClick={() => navigate("/chat")}
                  className="cursor-pointer bg-white text-purple-600 font-semibold px-8 py-3 rounded-xl hover:bg-purple-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  开始对话 →
                </button>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                极速开发
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Vite 提供闪电般的热更新体验
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                现代化UI
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                TailwindCSS 实现美观的响应式设计
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                类型安全
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                TypeScript 提供完整的类型检查
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
              <div className="text-3xl mb-3">⚛️</div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                组件化
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                React 18+ 提供强大的组件系统
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
