import { FunctionComponent, ReactNode, RefObject } from 'react';
import './VirtualScroll.scss';

export interface VirtualScrollProps {
  children: ReactNode;
  paddingTop: number;
  paddingBottom: number;
  onScroll: (e: React.UIEvent<HTMLElement>) => void;
  containerRef: RefObject<HTMLDivElement>;
}

/**
 * Virtual scroll container component
 * Handles scrolling and applies padding to maintain scroll position
 * Height is controlled by CSS (flex: 1) and measured by the useVirtualScroll hook
 */
export const VirtualScroll: FunctionComponent<VirtualScrollProps> = ({
  children,
  paddingTop,
  paddingBottom,
  onScroll,
  containerRef,
}) => {
  return (
    <div
      ref={containerRef}
      className="virtual-scroll__container"
      onScroll={onScroll}
      data-testid="virtual-scroll__container"
    >
      <div className="virtual-scroll__content" style={{ paddingTop, paddingBottom }}>
        {children}
      </div>
    </div>
  );
};
