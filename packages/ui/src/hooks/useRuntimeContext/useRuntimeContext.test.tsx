import catalogLibrary from '@kaoto/camel-catalog/index.json';
import { act, renderHook } from '@testing-library/react';
import { PropsWithChildren } from 'react';

import { RuntimeProvider } from '../../providers/runtime.provider';
import { CatalogSchemaLoader } from '../../utils/catalog-schema-loader';
import { errorMessage, useRuntimeContext } from './useRuntimeContext';

const wrapper = ({ children }: PropsWithChildren) => (
  <RuntimeProvider catalogUrl={CatalogSchemaLoader.DEFAULT_CATALOG_PATH}>{children}</RuntimeProvider>
);

describe('useRuntimeContext', () => {
  let fetchResolve: () => void;

  beforeEach(() => {
    const fetchMock = vi.spyOn(window, 'fetch');
    fetchMock.mockImplementationOnce((file) => {
      return new Promise((resolve) => {
        fetchResolve = () => {
          resolve({
            json: () => catalogLibrary,
            url: `http://localhost/${file}`,
          } as unknown as Response);
        };
      });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be throw when use hook without provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => null);
    expect(() => renderHook(() => useRuntimeContext())).toThrow(errorMessage);
    (console.error as vi.Mock).mockRestore();
  });

  it('should return RuntimeContext', async () => {
    const { result } = renderHook(() => useRuntimeContext(), { wrapper });

    await act(async () => {
      fetchResolve();
    });

    expect(result.current).not.toBe(null);
  });
});
