import {
  Button,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  TextInput,
  FormSelect,
  FormSelectOption,
} from '@patternfly/react-core';
import { useCallback, useMemo, useState } from 'react';

import { FILE_TYPES, type FileType } from '../fileTypes';

interface CreateFileModalProps {
  isOpen: boolean;
  existingFilenames: Set<string>;
  onClose: () => void;
  onCreate: (filename: string, content: string) => void;
}

export function CreateFileModal({ isOpen, existingFilenames, onClose, onCreate }: CreateFileModalProps) {
  const [name, setName] = useState('');
  const [typeIndex, setTypeIndex] = useState(0);

  const selectedType: FileType = FILE_TYPES[typeIndex];
  const filename = name ? `${name}${selectedType.suffix}` : '';

  const nameError = useMemo(() => {
    if (!name) return undefined;
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(name)) {
      return 'Name must start with a letter or digit and contain only letters, digits, hyphens, or underscores.';
    }
    if (existingFilenames.has(filename)) {
      return `A file named "${filename}" already exists.`;
    }
    return undefined;
  }, [name, filename, existingFilenames]);

  const isValid = name.length > 0 && !nameError;

  const handleCreate = useCallback(() => {
    if (!isValid) return;
    onCreate(filename, selectedType.template);
    setName('');
    setTypeIndex(0);
  }, [isValid, filename, selectedType, onCreate]);

  const handleClose = useCallback(() => {
    setName('');
    setTypeIndex(0);
    onClose();
  }, [onClose]);

  return (
    <Modal variant={ModalVariant.small} isOpen={isOpen} onClose={handleClose}>
      <ModalHeader title="New File" />
      <ModalBody>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
        >
          <FormGroup label="File type" isRequired fieldId="file-type">
            <FormSelect
              id="file-type"
              value={typeIndex}
              onChange={(_event, value) => setTypeIndex(Number(value))}
            >
              {FILE_TYPES.map((ft, i) => (
                <FormSelectOption key={ft.suffix} value={i} label={ft.label} />
              ))}
            </FormSelect>
          </FormGroup>

          <FormGroup label="File name" isRequired fieldId="file-name">
            <TextInput
              id="file-name"
              value={name}
              onChange={(_event, value) => setName(value)}
              validated={nameError ? 'error' : 'default'}
              placeholder="my-route"
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem variant={nameError ? 'error' : 'default'}>
                  {nameError ?? (filename ? `Will create: ${filename}` : `Suffix: ${selectedType.suffix}`)}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={handleCreate} isDisabled={!isValid}>
          Create
        </Button>
        <Button variant="link" onClick={handleClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}
