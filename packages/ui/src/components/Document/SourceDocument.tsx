import { FunctionComponent, useMemo } from 'react';
import { IDocument } from '../../models/datamapper/document';
import { DocumentMap } from '../../models/datamapper/document-map';
import { DocumentNodeData } from '../../models/datamapper/visualization';
import './Document.scss';
import { SourceDocumentNode } from './SourceDocumentNode';
import { VirtualScroll } from '../VirtualScroll/VirtualScroll';

type DocumentTreeProps = {
  document: IDocument;
  isReadOnly: boolean;
};

/**
 * Tree-based source document component for virtual scrolling implementation
 * Uses pre-parsed tree structure with simplified UI state management
 */
export const SourceDocument: FunctionComponent<DocumentTreeProps> = ({ document, isReadOnly }) => {
  const { documentNodeData, documentMap, documentId } = useMemo(() => {
    const documentNodeData = new DocumentNodeData(document);
    const documentMap = new DocumentMap(documentNodeData);
    const documentId = documentNodeData.id;
    return { documentNodeData, documentMap, documentId };
  }, [document]);

  return (
    <>
      <SourceDocumentNode nodeData={documentNodeData} documentId={documentId} isReadOnly={isReadOnly} rank={0} />

      <VirtualScroll>
        {Object.keys(documentMap.items)
          .sort()
          .map((key) => {
            const nodeDataEntry = documentMap.getItem(key);

            return (
              <p key={key}>
                {nodeDataEntry?.rank} - {key}
              </p>
            );
          })}
      </VirtualScroll>
    </>
  );
};
