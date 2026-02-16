import { renderHook } from '@testing-library/react';
import { PropsWithChildren } from 'react';

import { ReloadContext } from '../../providers';
import { errorMessage, useReloadContext } from './useReloadContext';

const wrapper = ({ children }: PropsWithChildren) => (
  <ReloadContext.Provider value={{ lastRender: -1, reloadPage: () => {} }}>{children}</ReloadContext.Provider>
);

describe('useReloadContext', () => {
  it('should be throw when use hook without provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => null);
    expect(() => renderHook(() => useReloadContext())).toThrow(errorMessage);
    (console.error as vi.Mock).mockRestore();
  });

  it('should return ReloadContext', () => {
    const { result } = renderHook(() => useReloadContext(), { wrapper });

    expect(result.current).not.toBeUndefined();
  });
});
