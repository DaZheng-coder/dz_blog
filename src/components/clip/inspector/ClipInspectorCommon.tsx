import type { ReactNode } from "react";

type ClipInspectorSectionProps = {
  title: string;
  children: ReactNode;
};

export function ClipInspectorSection({
  title,
  children,
}: ClipInspectorSectionProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs text-[#9ca3af]">{title}</p>
      <div className="mt-2 space-y-2 text-xs">{children}</div>
    </section>
  );
}

type ClipInspectorInfoRowProps = {
  label: string;
  value: ReactNode;
  valueClassName?: string;
  className?: string;
};

export function ClipInspectorInfoRow({
  label,
  value,
  valueClassName,
  className,
}: ClipInspectorInfoRowProps) {
  return (
    <div className={`flex items-center justify-between ${className || ""}`}>
      <span className="text-[#cbd5e1]">{label}</span>
      <span
        className={`rounded bg-white/10 px-2 py-0.5 text-white ${
          valueClassName || ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
