/**
 * Virtual scrolling service - Pure functions for viewport calculations
 */

export interface VirtualWindow {
  startIndex: number;
  endIndex: number;
  paddingTop: number;
  paddingBottom: number;
}

/**
 * Calculate which items should be rendered based on scroll position
 *
 * @param scrollTop - Current scroll position in pixels
 * @param itemHeight - Height of each item in pixels
 * @param containerHeight - Height of the scrollable container in pixels
 * @param totalItems - Total number of items in the list
 * @param overscan - Number of extra items to render above/below viewport (default: 5)
 * @returns Virtual window with indices and padding values
 */
export function calculateWindow(
  scrollTop: number,
  itemHeight: number,
  containerHeight: number,
  totalItems: number,
  overscan = 5,
): VirtualWindow {
  // Calculate start index with overscan
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);

  // Calculate how many items fit in viewport
  const visibleCount = Math.ceil(containerHeight / itemHeight);

  // Calculate end index with overscan
  const endIndex = Math.min(totalItems, startIndex + visibleCount + overscan * 2);

  // Calculate padding to maintain scroll position
  const paddingTop = startIndex * itemHeight;
  const paddingBottom = Math.max(0, (totalItems - endIndex) * itemHeight);

  return {
    startIndex,
    endIndex,
    paddingTop,
    paddingBottom,
  };
}
