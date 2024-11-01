import { Button } from '@patternfly/react-core';
import { directoryOpen, fileSave, FileWithDirectoryAndFileHandle } from 'browser-fs-access';
import { FunctionComponent, useContext, useState } from 'react';
import { SourceCodeContext, SourceCodeApiContext } from '../../../../providers';

export const Files: FunctionComponent = () => {
  const sourceCodeContext = useContext(SourceCodeContext);
  const sourceCodeApiContext = useContext(SourceCodeApiContext);
  const [yamlFiles, setYamlFiles] = useState<(FileWithDirectoryAndFileHandle | FileSystemDirectoryHandle)[]>([]);
  const [file, setFile] = useState<FileWithDirectoryAndFileHandle | FileSystemDirectoryHandle | null>(null);

  // Function to open a directory and filter YAML files
  const handleOpenFolder = async () => {
    try {
      const files = await directoryOpen({
        recursive: false, // Set to true if you want to include files from subdirectories
      });

      // Filter for YAML files and extract their names
      const yamlFileNames = files.filter((file) => file.name.endsWith('.yaml') || file.name.endsWith('.yml'));

      setYamlFiles(yamlFileNames);
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  return (
    <>
      <Button onClick={handleOpenFolder}>Open Folder</Button>

      <Button
        onClick={async () => {
          /** Save the existing content to the file */
          const existingContent = sourceCodeContext;
          const blob = new Blob([existingContent], { type: 'text/plain' });
          await fileSave(blob, { fileName: file.name });
        }}
      >
        Save file
      </Button>

      {yamlFiles.map((file, index) => {
        console.log(file, index);

        return (
          <Button
            key={index}
            onClick={async () => {
              /** Read the file content */
              const content = await file.text();

              /** Set the file */
              setFile(file);

              /** Update Entities and Visual Entities */
              sourceCodeApiContext.setCodeAndNotify(content);
            }}
          >
            {file.name}
          </Button>
        );
      })}
    </>
  );
};
