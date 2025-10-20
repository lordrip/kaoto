import { FunctionComponent, ReactNode } from 'react';
import './VirtualScroll.scss';

export interface VirtualScrollProps {
  children: ReactNode;
  height: number | string;
  paddingTop: number;
  paddingBottom: number;
  onScroll: (e: React.UIEvent<HTMLElement>) => void;
}

/**
 * Virtual scroll container component
 * Handles scrolling and applies padding to maintain scroll position
 */
export const VirtualScroll: FunctionComponent<VirtualScrollProps> = ({
  children,
  height,
  paddingTop,
  paddingBottom,
  onScroll,
}) => {
  return (
    <div
      className="virtual-scroll__container"
      style={{ height, overflow: 'auto' }}
      onScroll={onScroll}
      data-testid="virtual-scroll__container"
    >
      <div className="virtual-scroll__content" style={{ paddingTop, paddingBottom }}>
        {children}
      </div>
    </div>
  );
};
