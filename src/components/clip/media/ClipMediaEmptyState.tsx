import LoadingIcon from "../../../assets/loading.svg?react";

type ClipMediaEmptyStateProps = {
  isParsing: boolean;
};

export function ClipMediaEmptyState({ isParsing }: ClipMediaEmptyStateProps) {
  return (
    <div className="grid h-full place-items-center rounded-lg border border-dashed border-white/20 bg-white/[0.02] p-4 text-center">
      {isParsing ? (
        <div className="flex flex-col items-center justify-center text-white">
          <LoadingIcon className="h-8 w-8 animate-spin [animation-duration:1.6s] fill-current" />
          <p className="mt-3 text-xs text-[#67e8f9]">正在解析视频信息...</p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-white">拖拽素材到这里</p>
          <p className="mt-1 text-xs text-[#9ca3af]">
            或点击右上角“导入素材”选择本地文件
          </p>
        </div>
      )}
    </div>
  );
}
