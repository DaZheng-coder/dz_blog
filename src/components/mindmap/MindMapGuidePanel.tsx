import { FLOATING_CARD_CLASS } from "./styles";

export function MindMapGuidePanel() {
  return (
    <div
      className={`absolute top-4 left-4 ${FLOATING_CARD_CLASS} p-3 text-xs text-gray-600 z-10 max-w-xs`}
    >
      <div className="font-semibold mb-2 text-blue-600">🎯 操作指南</div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-blue-500">•</span>
          <span>单击节点：选中节点（选中后可用快捷键）</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-blue-500">•</span>
          <span>双击节点：编辑文本</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-500">•</span>
          <span>拖拽节点：移动到其他节点下（显示插入预览）</span>
        </div>
        <div className="border-t border-gray-200 my-2"></div>
        <div className="font-semibold mb-1 text-green-600">⌨️ 快捷键</div>
        <div className="flex items-center gap-2">
          <span className="text-green-500">•</span>
          <span>
            <kbd className="px-1 bg-gray-100 border rounded">Enter</kbd>{" "}
            添加同级节点
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-500">•</span>
          <span>
            <kbd className="px-1 bg-gray-100 border rounded">Tab</kbd> 添加子节点
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-500">•</span>
          <span>
            <kbd className="px-1 bg-gray-100 border rounded">Delete</kbd>{" "}
            删除选中节点
          </span>
        </div>
        <div className="border-t border-gray-200 my-2"></div>
        <div className="flex items-center gap-2">
          <span className="text-purple-500">•</span>
          <span>滚轮：缩放画布</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-purple-500">•</span>
          <span>拖拽空白：平移画布</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-orange-500">•</span>
          <span>+/− 按钮：展开/收缩子节点</span>
        </div>
      </div>
    </div>
  );
}
