import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ClipButtonVariant =
  | "subtle"
  | "timeline-zoom"
  | "inspector-action"
  | "inspector-action-active";

type ClipButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement>
> & {
  variant?: ClipButtonVariant;
};

const variantClassMap: Record<ClipButtonVariant, string> = {
  subtle:
    "cursor-pointer rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#d1d5db] transition hover:border-[#22d3ee]/70 hover:text-white",
  "timeline-zoom":
    "cursor-pointer rounded border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-[#d1d5db]",
  "inspector-action":
    "cursor-pointer rounded-md border border-white/10 bg-white/5 py-1.5 text-[#d1d5db]",
  "inspector-action-active":
    "cursor-pointer rounded-md border border-[#22d3ee]/60 bg-[#22d3ee]/10 py-1.5 text-[#67e8f9]",
};

export function ClipButton({
  variant = "subtle",
  className,
  children,
  ...buttonProps
}: ClipButtonProps) {
  return (
    <button
      {...buttonProps}
      className={`${variantClassMap[variant]} ${className || ""}`.trim()}
    >
      {children}
    </button>
  );
}
