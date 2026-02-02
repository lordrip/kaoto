import { useLayoutEffect, useRef } from 'react';

import { useDocumentTreeStore } from '../store/document-tree.store';

export const useConnectionPort = (nodePath: string) => {
  const setConnectionPort = useDocumentTreeStore((state) => state.setConnectionPort);
  const unsetConnectionPort = useDocumentTreeStore((state) => state.unsetConnectionPort);
  const portRef = useRef<HTMLSpanElement>(null);

  // Use useLayoutEffect to update positions synchronously before paint
  // Only recalculates when node mounts/unmounts - scroll updates are handled via batched DOM queries
  useLayoutEffect(() => {
    if (!portRef.current) return;

    const rect = portRef.current.getBoundingClientRect();
    const centerOffset = (rect?.height ?? 0) / 2;
    const position: [number, number] = [(rect?.x ?? 0) + centerOffset, (rect?.y ?? 0) + centerOffset];

    setConnectionPort(nodePath, position);

    return () => {
      unsetConnectionPort(nodePath);
    };
  }, [nodePath, setConnectionPort, unsetConnectionPort]);

  return {
    portRef,
  };
};
