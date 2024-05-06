import type {} from '@redux-devtools/extension'; // required for devtools typing
import { temporal } from 'zundo';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface SourceCodeState {
  sourceCode: string;
  setSourceCode: (sourceCode: string) => void;
}

export const useSourceCodeStore = create<SourceCodeState>()(
  devtools(
    temporal((set) => ({
      sourceCode: '',
      setSourceCode: (sourceCode: string) => {
        set(() => ({ sourceCode }));
      },
    })),
    { name: 'Source code store' },
  ),
);
