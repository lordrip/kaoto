import { FunctionComponent, PropsWithChildren } from 'react';
import './VirtualScrollItem.scss';

export interface VirtualScrollItemProps {
  rank: number;
}

/**
 * Virtual scroll item wrapper component
 * Applies rank-based indentation and renders a document node
 */
export const VirtualScrollItem: FunctionComponent<PropsWithChildren<VirtualScrollItemProps>> = ({ children, rank }) => {
  return (
    <div className="virtual-scroll-item" style={{ '--rank': rank } as React.CSSProperties}>
      {children}
    </div>
  );
};
