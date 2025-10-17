import { FunctionComponent, PropsWithChildren, UIEventHandler, useCallback } from 'react';
import './VirtualScroll.scss';

export const VirtualScroll: FunctionComponent<PropsWithChildren> = ({ children }) => {
  const onScroll: UIEventHandler<HTMLDivElement> = useCallback((event) => {
    console.log('scroll', event);
  }, []);

  return (
    <div className="virtual-scroll__container" onScroll={onScroll} data-testid="virtual-scroll__container">
      {children}
    </div>
  );
};
