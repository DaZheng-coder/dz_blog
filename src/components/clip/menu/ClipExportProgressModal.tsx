import CongratulateIcon from "../../../assets/congratulate.svg?react";

type ClipExportProgressModalProps = {
  isOpen: boolean;
  isExporting: boolean;
  progress: number;
  message: string;
  error: string | null;
  downloadFilename: string | null;
  onDownload: () => void;
  onClose: () => void;
};

export function ClipExportProgressModal({
  isOpen,
  isExporting,
  progress,
  message,
  error,
  downloadFilename,
  onDownload,
  onClose,
}: ClipExportProgressModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-white/15 bg-[#0b111b] p-4 text-[#e5e7eb] shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">导出进度</h3>
          <button
            className="cursor-pointer rounded border border-white/15 px-2 py-0.5 text-xs text-[#9ca3af] hover:border-[#22d3ee]/60 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onClose}
            disabled={isExporting}
          >
            关闭
          </button>
        </div>

        <p className="mb-2 text-xs text-[#9ca3af]">{message}</p>

        {!error && !downloadFilename ? (
          <>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#22d3ee] to-[#3b82f6] transition-all"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
            <div className="mt-2 text-right text-xs text-[#cbd5e1]">
              {Math.round(progress)}%
            </div>
          </>
        ) : null}

        {downloadFilename ? (
          <div className="flex flex-col items-center justify-center">
            <CongratulateIcon className="h-40 w-40 fill-current" />
            <div className="mt-3 rounded border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 flex flex-col items-center justify-center">
              <p>导出完成，可以下载视频文件。</p>
              <button
                className="mt-2 cursor-pointer rounded border border-emerald-300/40 bg-emerald-500/20 px-2 py-1 text-xs text-emerald-100 hover:border-emerald-200/70"
                onClick={onDownload}
              >
                下载视频
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="mt-3 rounded border border-red-400/30 bg-red-500/10 px-2 py-1 text-xs text-red-300">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
