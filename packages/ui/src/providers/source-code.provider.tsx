import { FunctionComponent, PropsWithChildren, createContext, useCallback, useLayoutEffect, useMemo } from 'react';
import { useSourceCodeStore } from '../store';
import { EventNotifier } from '../utils';

interface ISourceCodeApi {
  /** Set the Source Code and notify subscribers */
  setCodeAndNotify: (sourceCode: string, path?: string) => void;
}

interface SourceCodeProviderProps extends PropsWithChildren {
  /** The initial source code */
  initialSourceCode?: string;
}

export const SourceCodeContext = createContext<string>('');
export const SourceCodeApiContext = createContext<ISourceCodeApi>({ setCodeAndNotify: () => {} });

export const SourceCodeProvider: FunctionComponent<SourceCodeProviderProps> = ({
  initialSourceCode = '',
  children,
}) => {
  const eventNotifier = EventNotifier.getInstance();
  const { sourceCode, setSourceCode, setPath } = useSourceCodeStore();

  useLayoutEffect(() => {
    setSourceCode(initialSourceCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    return eventNotifier.subscribe('entities:updated', (code) => {
      setSourceCode(code);
    });
  }, [eventNotifier, initialSourceCode, setSourceCode]);

  const setCodeAndNotify = useCallback(
    (code: string, path?: string) => {
      setSourceCode(code);
      setPath(path);
    },
    [setPath, setSourceCode],
  );

  const sourceCodeApi: ISourceCodeApi = useMemo(
    () => ({
      setCodeAndNotify,
    }),
    [setCodeAndNotify],
  );

  return (
    <SourceCodeApiContext.Provider value={sourceCodeApi}>
      <SourceCodeContext.Provider value={sourceCode}>{children}</SourceCodeContext.Provider>
    </SourceCodeApiContext.Provider>
  );
};
