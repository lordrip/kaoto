import type {} from '@redux-devtools/extension'; // required for devtools typing
import { temporal } from 'zundo';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface SourceCodeState {
  sourceCode: string;
  path?: string;
  setSourceCode: (sourceCode: string) => void;
  setPath: (path?: string) => void;
}

export const useSourceCodeStore = create<SourceCodeState>()(
  devtools(
    temporal((set) => ({
      sourceCode: '',
      path: '',
      setSourceCode: (sourceCode: string) => {
        set(() => ({ sourceCode }));
      },
      setPath: (path?: string) => {
        set(() => ({ path }));
      },
    })),
    { name: 'Source code store' },
  ),
);
