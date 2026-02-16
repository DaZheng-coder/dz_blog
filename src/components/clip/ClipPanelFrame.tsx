import type { ReactNode } from "react";

type ClipPanelFrameProps = {
  title: string;
  titleClassName?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

function cx(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function ClipPanelFrame({
  title,
  titleClassName,
  rightSlot,
  children,
  className,
  bodyClassName,
}: ClipPanelFrameProps) {
  return (
    <section
      className={cx(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0f1522]/90",
        className
      )}
    >
      <div className="flex h-11 items-center justify-between border-b border-white/10 px-4">
        <p className={cx("text-sm font-medium text-white", titleClassName)}>
          {title}
        </p>
        {rightSlot}
      </div>
      <div className={cx("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}
