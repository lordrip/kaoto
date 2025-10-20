import { useEffect, useMemo, useRef, useState } from 'react';
import { calculateViewport } from './calculate-viewport';

export interface VirtualScrollConfig<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
}

export interface VirtualScrollResult<T> {
  visibleItems: T[];
  paddingTop: number;
  paddingBottom: number;
  onScroll: (e: React.UIEvent<HTMLElement>) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * React hook for virtual scrolling
 * Automatically measures container height using ResizeObserver
 *
 * @param config - Configuration object with items, itemHeight, and overscan
 * @returns Virtual scroll state, handlers, and containerRef
 */
export function useVirtualScroll<T>({
  items,
  itemHeight,
  overscan = 5,
}: VirtualScrollConfig<T>): VirtualScrollResult<T> {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600); // Default fallback
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure container height with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        if (height > 0) {
          setContainerHeight(height);
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate which items should be visible
  const viewPort = useMemo(
    () => calculateViewport(scrollTop, itemHeight, containerHeight, items.length, overscan),
    [scrollTop, itemHeight, containerHeight, items.length, overscan],
  );

  // Slice the items array to get only visible items
  const visibleItems = useMemo(
    () => items.slice(viewPort.startIndex, viewPort.endIndex),
    [items, viewPort.startIndex, viewPort.endIndex],
  );

  // Scroll event handler
  const onScroll = (e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return {
    visibleItems,
    paddingTop: viewPort.paddingTop,
    paddingBottom: viewPort.paddingBottom,
    containerRef,
    onScroll,
  };
}
