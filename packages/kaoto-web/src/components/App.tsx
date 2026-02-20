import { Page, PageSection } from '@patternfly/react-core';
import type { Editor } from '@kie-tools-core/editor/dist/api';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { WebEditorChannelApi } from '../channel/WebEditorChannelApi';
import type { SampleRoute } from '../sampleRoutes';
import { listFiles, readFile, saveFile, deleteFile, type StoredFile } from '../storage/fileStorage';
import { CreateFileModal } from './CreateFileModal';
import { RouteSidebar } from './RouteSidebar';

export interface FileEntry {
  filename: string;
  name: string;
  isSample: boolean;
}

interface AppProps {
  editor: Editor;
  channelApi: WebEditorChannelApi;
  onNewEdit: (callback: () => void) => void;
  sampleRoutes: SampleRoute[];
}

export function App({ editor, channelApi, onNewEdit, sampleRoutes }: AppProps) {
  const [activeFile, setActiveFile] = useState<string | undefined>();
  const [storedFiles, setStoredFiles] = useState<StoredFile[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const isLoadingRef = useRef(false);

  /** Content cache so the channelApi content provider can return synchronously. */
  const contentCacheRef = useRef<{ filename: string; content: string }>({ filename: '', content: '' });

  // Load the list of persisted files on mount
  const refreshFileList = useCallback(async () => {
    const files = await listFiles();
    setStoredFiles(files);
  }, []);

  useEffect(() => {
    refreshFileList();
  }, [refreshFileList]);

  // Build the unified file list: persisted files first, then samples not yet saved
  const fileEntries: FileEntry[] = [
    ...storedFiles.map((f) => ({
      filename: f.filename,
      name: sampleRoutes.find((s) => s.filename === f.filename)?.name ?? f.filename.replace(/\.\w+\.yaml$/, ''),
      isSample: false,
    })),
    ...sampleRoutes
      .filter((s) => !storedFiles.some((f) => f.filename === s.filename))
      .map((s) => ({
        filename: s.filename,
        name: s.name,
        isSample: true,
      })),
  ];

  // Set of all known filenames for duplicate detection in the modal
  const existingFilenames = useMemo(() => {
    const set = new Set<string>();
    storedFiles.forEach((f) => set.add(f.filename));
    sampleRoutes.forEach((s) => set.add(s.filename));
    return set;
  }, [storedFiles, sampleRoutes]);

  // Auto-save: when the editor emits a new edit, persist via getContent()
  useEffect(() => {
    onNewEdit(async () => {
      const filename = contentCacheRef.current.filename;
      if (!filename) return;

      try {
        const yaml = await editor.getContent();
        contentCacheRef.current.content = yaml;
        await saveFile(filename, yaml);
        refreshFileList();
      } catch (err) {
        console.error('[KaotoWeb] Auto-save failed:', err);
      }
    });
  }, [editor, onNewEdit, refreshFileList]);

  /** Open a file by filename — reads from IndexedDB first, falls back to samples. */
  const openFile = useCallback(
    async (filename: string) => {
      if (isLoadingRef.current || filename === activeFile) return;
      isLoadingRef.current = true;

      try {
        let content = await readFile(filename);
        if (content === undefined) {
          const sample = sampleRoutes.find((s) => s.filename === filename);
          if (sample) {
            content = sample.content;
            await saveFile(filename, content);
            await refreshFileList();
          }
        }

        if (content === undefined) {
          console.warn(`[KaotoWeb] No content for "${filename}"`);
          return;
        }

        contentCacheRef.current = { filename, content };
        channelApi.setContentProvider(() => ({
          content: contentCacheRef.current.content,
          normalizedPosixPathRelativeToTheWorkspaceRoot: contentCacheRef.current.filename,
        }));

        setActiveFile(filename);
        await editor.setContent(filename, content);
      } catch (err) {
        console.error('[KaotoWeb] Failed to open file:', err);
      } finally {
        isLoadingRef.current = false;
      }
    },
    [activeFile, channelApi, editor, sampleRoutes, refreshFileList],
  );

  const handleDeleteFile = useCallback(
    async (filename: string) => {
      await deleteFile(filename);
      if (activeFile === filename) {
        setActiveFile(undefined);
      }
      await refreshFileList();
    },
    [activeFile, refreshFileList],
  );

  /** Called from the modal when the user confirms a new file. */
  const handleCreateFile = useCallback(
    async (filename: string, content: string) => {
      await saveFile(filename, content);
      await refreshFileList();
      setIsCreateModalOpen(false);
      // Open the newly created file
      await openFile(filename);
    },
    [refreshFileList, openFile],
  );

  const sidebar = (
    <RouteSidebar
      files={fileEntries}
      activeFilename={activeFile}
      onSelectFile={openFile}
      onDeleteFile={handleDeleteFile}
      onCreateFile={() => setIsCreateModalOpen(true)}
    />
  );

  return (
    <Page sidebar={sidebar}>
      <PageSection isFilled hasOverflowScroll padding={{ default: 'noPadding' }}>
        <div style={{ width: '100%', height: '100%' }}>
          {editor.af_componentRoot() as React.ReactElement}
        </div>
      </PageSection>

      <CreateFileModal
        isOpen={isCreateModalOpen}
        existingFilenames={existingFilenames}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateFile}
      />
    </Page>
  );
}
