import { useEffect, useRef, useState } from "react";

type RevealOnViewProps = {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
};

export function RevealOnView({
  children,
  className = "",
  threshold = 0.12,
  rootMargin = "0px 0px -8% 0px",
}: RevealOnViewProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(
    () => typeof window !== "undefined" && !("IntersectionObserver" in window),
  );

  useEffect(() => {
    const node = ref.current;
    if (!node || inView) return;

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [inView, threshold, rootMargin]);

  return (
    <div ref={ref} className={`reveal-on-view ${inView ? "in-view" : ""} ${className}`}>
      {children}
    </div>
  );
}
