import { FunctionComponent, useMemo } from 'react';
import { IDocument } from '../../models/datamapper/document';
import { DocumentMap } from '../../models/datamapper/document-map';
import { DocumentNodeData } from '../../models/datamapper/visualization';
import { useVirtualScroll } from '../VirtualScroll/useVirtualScroll';
import { VirtualScroll } from '../VirtualScroll/VirtualScroll';
import { VirtualScrollItem } from '../VirtualScroll/VirtualScrollItem';
import './Document.scss';
import { SourceDocumentNode } from './SourceDocumentNode';

type DocumentTreeProps = {
  document: IDocument;
  isReadOnly: boolean;
};

/**
 * Tree-based source document component with virtual scrolling
 * Renders only visible items in viewport for performance
 */
export const SourceDocument: FunctionComponent<DocumentTreeProps> = ({ document, isReadOnly }) => {
  const { allItems, documentId } = useMemo(() => {
    const documentNodeData = new DocumentNodeData(document);
    const documentMap = new DocumentMap(documentNodeData);
    const documentId = documentNodeData.id;

    // Convert DocumentMap Record to Array for virtual scrolling
    const allItems = Object.entries(documentMap.items).map(([path, entry]) => ({
      path,
      nodeData: entry.nodeData,
      rank: entry.rank,
    }));

    return { allItems, documentId };
  }, [document]);

  const { visibleItems, paddingTop, paddingBottom, onScroll } = useVirtualScroll({
    items: allItems,
    itemHeight: 40, // Fixed height for MVP
    containerHeight: 600, // TODO: Make dynamic
  });

  return (
    <VirtualScroll height={600} paddingTop={paddingTop} paddingBottom={paddingBottom} onScroll={onScroll}>
      {visibleItems.map((item) => (
        <VirtualScrollItem key={item.path} rank={item.rank}>
          <SourceDocumentNode
            nodeData={item.nodeData}
            rank={item.rank}
            documentId={documentId}
            isReadOnly={isReadOnly}
          />
        </VirtualScrollItem>
      ))}
    </VirtualScroll>
  );
};
