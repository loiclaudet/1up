import { useLayoutEffect, useState, type RefObject } from 'react';

/// an element's size, kept up to date
export function useSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // at once, not only when the observer first reports: the first paint is laid out at the right size
    setSize({ w: el.clientWidth, h: el.clientHeight });
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: width, h: height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}
