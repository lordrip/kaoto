import { useState, useMemo } from 'react';
import { calculateWindow } from './virtual-scroll.service';

export interface VirtualScrollConfig<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export interface VirtualScrollResult<T> {
  visibleItems: T[];
  paddingTop: number;
  paddingBottom: number;
  onScroll: (e: React.UIEvent<HTMLElement>) => void;
  window: {
    startIndex: number;
    endIndex: number;
    paddingTop: number;
    paddingBottom: number;
  };
}

/**
 * React hook for virtual scrolling
 *
 * @param config - Configuration object with items, heights, and overscan
 * @returns Virtual scroll state and handlers
 */
export function useVirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: VirtualScrollConfig<T>): VirtualScrollResult<T> {
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate which items should be visible
  const window = useMemo(
    () => calculateWindow(scrollTop, itemHeight, containerHeight, items.length, overscan),
    [scrollTop, itemHeight, containerHeight, items.length, overscan],
  );

  // Slice the items array to get only visible items
  const visibleItems = useMemo(
    () => items.slice(window.startIndex, window.endIndex),
    [items, window.startIndex, window.endIndex],
  );

  // Scroll event handler
  const onScroll = (e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return {
    visibleItems,
    paddingTop: window.paddingTop,
    paddingBottom: window.paddingBottom,
    onScroll,
    window, // For debugging
  };
}
