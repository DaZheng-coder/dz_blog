type ClipExportProgressModalProps = {
  isOpen: boolean;
  isExporting: boolean;
  progress: number;
  message: string;
  error: string | null;
  onClose: () => void;
};

export function ClipExportProgressModal({
  isOpen,
  isExporting,
  progress,
  message,
  error,
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
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#22d3ee] to-[#3b82f6] transition-all"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
        <div className="mt-2 text-right text-xs text-[#cbd5e1]">
          {Math.round(progress)}%
        </div>

        {error ? (
          <p className="mt-3 rounded border border-red-400/30 bg-red-500/10 px-2 py-1 text-xs text-red-300">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
