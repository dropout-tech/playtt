import { useEffect, useRef, useState } from "react";

type Options = {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
};

/**
 * 元件第一次進入視窗時回傳 true，之後保持 true。
 * - 用於「捲到才播放」的進場動畫，避免一載入全部動畫同時跑。
 * - 自帶 SSR/不支援 IntersectionObserver 的 fallback（直接視為 inView）。
 */
export function useInViewOnce<T extends Element>(options?: Options) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    if (typeof window === "undefined" || typeof (window as any).IntersectionObserver === "undefined") {
      setInView(true);
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
      {
        root: options?.root ?? null,
        rootMargin: options?.rootMargin ?? "0px 0px -10% 0px",
        threshold: options?.threshold ?? 0.15,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, options?.root, options?.rootMargin, options?.threshold]);

  return { ref, inView } as const;
}

