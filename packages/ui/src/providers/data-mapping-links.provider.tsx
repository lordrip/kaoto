import {
  createContext,
  FunctionComponent,
  PropsWithChildren,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useDataMapper } from '../hooks/useDataMapper';
import { IMappingLink } from '../models/datamapper';
import { MappingLinksService } from '../services/mapping-links.service';
import { useDocumentTreeStore } from '../store';

export interface IMappingLinksContext {
  mappingLinkCanvasRef: RefObject<HTMLDivElement | null>;
  getMappingLinks: () => IMappingLink[];
  setSelectedNode: (nodePath: string | null, isSource: boolean) => void;
  toggleSelectedNode: (nodePath: string, isSource: boolean) => void;
  isNodeInSelectedMapping: (nodePath: string) => boolean;
}

export const MappingLinksContext = createContext<IMappingLinksContext | undefined>(undefined);

export const MappingLinksProvider: FunctionComponent<PropsWithChildren> = ({ children }) => {
  const { mappingTree, sourceParameterMap, sourceBodyDocument } = useDataMapper();
  const [mappingLinks, setMappingLinks] = useState<IMappingLink[]>([]);
  const mappingLinkCanvasRef = useRef<HTMLDivElement | null>(null);

  // Subscribe to store
  const selectedNodePath = useDocumentTreeStore((state) => state.selectedNodePath);
  const selectedNodeIsSource = useDocumentTreeStore((state) => state.selectedNodeIsSource);
  const setSelectedNodeStore = useDocumentTreeStore((state) => state.setSelectedNode);
  const toggleSelectedNodeStore = useDocumentTreeStore((state) => state.toggleSelectedNode);

  useEffect(() => {
    const links = MappingLinksService.extractMappingLinks(
      mappingTree,
      sourceParameterMap,
      sourceBodyDocument,
      selectedNodePath,
      selectedNodeIsSource,
    );
    setMappingLinks(links);
  }, [mappingTree, selectedNodePath, selectedNodeIsSource, sourceBodyDocument, sourceParameterMap]);

  const setSelectedNode = useCallback(
    (nodePath: string | null, isSource: boolean) => {
      setSelectedNodeStore(nodePath, isSource);
    },
    [setSelectedNodeStore],
  );

  const toggleSelectedNode = useCallback(
    (nodePath: string, isSource: boolean) => {
      toggleSelectedNodeStore(nodePath, isSource);
    },
    [toggleSelectedNodeStore],
  );

  const isNodeInSelectedMapping = useCallback(
    (nodePath: string): boolean => {
      if (!selectedNodePath) return false;
      return MappingLinksService.isNodeInSelectedMapping(mappingLinks, nodePath);
    },
    [mappingLinks, selectedNodePath],
  );

  const value = useMemo(() => {
    return {
      mappingLinkCanvasRef,
      getMappingLinks: () => mappingLinks,
      setSelectedNode,
      toggleSelectedNode,
      isNodeInSelectedMapping,
    };
  }, [isNodeInSelectedMapping, mappingLinkCanvasRef, mappingLinks, setSelectedNode, toggleSelectedNode]);

  return <MappingLinksContext.Provider value={value}>{children}</MappingLinksContext.Provider>;
};
