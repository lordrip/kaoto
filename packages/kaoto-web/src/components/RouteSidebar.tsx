import {
  Button,
  Nav,
  NavItem,
  NavList,
  NavGroup,
  PageSidebar,
  PageSidebarBody,
} from '@patternfly/react-core';
import { PlusCircleIcon, TrashIcon } from '@patternfly/react-icons';

import type { FileEntry } from './App';

interface RouteSidebarProps {
  files: FileEntry[];
  activeFilename: string | undefined;
  onSelectFile: (filename: string) => void;
  onDeleteFile: (filename: string) => void;
  onCreateFile: () => void;
}

export function RouteSidebar({ files, activeFilename, onSelectFile, onDeleteFile, onCreateFile }: RouteSidebarProps) {
  const storedFiles = files.filter((f) => !f.isSample);
  const sampleFiles = files.filter((f) => f.isSample);

  return (
    <PageSidebar>
      <PageSidebarBody>
        <div style={{ padding: '1rem 1rem 0.5rem' }}>
          <Button variant="primary" icon={<PlusCircleIcon />} isBlock onClick={onCreateFile}>
            New File
          </Button>
        </div>

        <Nav aria-label="Route files">
          {storedFiles.length > 0 && (
            <NavGroup title="My Routes">
              {storedFiles.map((file) => (
                <NavItem
                  key={file.filename}
                  isActive={activeFilename === file.filename}
                  onClick={() => onSelectFile(file.filename)}
                >
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span>
                      <div>{file.name}</div>
                      <small style={{ opacity: 0.6 }}>{file.filename}</small>
                    </span>
                    <Button
                      variant="plain"
                      size="sm"
                      aria-label={`Delete ${file.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFile(file.filename);
                      }}
                    >
                      <TrashIcon />
                    </Button>
                  </span>
                </NavItem>
              ))}
            </NavGroup>
          )}

          <NavGroup title="Samples">
            <NavList>
              {sampleFiles.map((file) => (
                <NavItem
                  key={file.filename}
                  isActive={activeFilename === file.filename}
                  onClick={() => onSelectFile(file.filename)}
                >
                  {file.name}
                </NavItem>
              ))}
            </NavList>
          </NavGroup>
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );
}
