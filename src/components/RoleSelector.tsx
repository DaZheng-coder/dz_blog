import { type FC } from "react";
import type { TCharacterConfig } from "../types/chat";

interface IRoleSelectorProps {
  characters: TCharacterConfig[];
  selectedCharacter: TCharacterConfig;
  onSelectCharacter: (character: TCharacterConfig) => void;
}

/**
 * 角色选择组件
 * 允许用户选择不同的 AI 角色进行对话
 */
export const RoleSelector: FC<IRoleSelectorProps> = ({
  characters,
  selectedCharacter,
  onSelectCharacter,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span className="text-2xl">🎭</span>
        选择角色
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.map((character) => (
          <button
            key={character.id}
            onClick={() => onSelectCharacter(character)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
              selectedCharacter.id === character.id
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md scale-105"
                : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md hover:scale-102"
            }`}
          >
            {/* 角色头像/图标 */}
            <div className="flex items-center gap-3 mb-2">
              <div className="text-3xl">{character.avatar || "🤖"}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 dark:text-white">
                  {character.name}
                </h4>
                {selectedCharacter.id === character.id && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    ✓ 当前角色
                  </span>
                )}
              </div>
            </div>

            {/* 角色描述 */}
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {character.description}
            </p>
          </button>
        ))}
      </div>

      {/* 当前角色详情 */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="text-4xl">{selectedCharacter.avatar || "🤖"}</div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-800 dark:text-white text-lg mb-1">
              {selectedCharacter.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {selectedCharacter.description}
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-500 bg-white dark:bg-gray-800 rounded p-2 mt-2">
              <span className="font-semibold">系统提示词: </span>
              {selectedCharacter.systemPrompt}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
