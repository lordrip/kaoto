import {
  Button,
  Nav,
  NavItem,
  NavList,
  NavGroup,
  PageSidebar,
  PageSidebarBody,
} from '@patternfly/react-core';
import { TrashIcon } from '@patternfly/react-icons';

import type { FileEntry } from './App';

interface RouteSidebarProps {
  files: FileEntry[];
  activeFilename: string | undefined;
  onSelectFile: (filename: string) => void;
  onDeleteFile: (filename: string) => void;
}

export function RouteSidebar({ files, activeFilename, onSelectFile, onDeleteFile }: RouteSidebarProps) {
  const storedFiles = files.filter((f) => !f.isSample);
  const sampleFiles = files.filter((f) => f.isSample);

  return (
    <PageSidebar>
      <PageSidebarBody>
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
                    {file.name}
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
