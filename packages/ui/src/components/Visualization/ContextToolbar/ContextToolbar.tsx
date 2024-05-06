import { Button, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { FunctionComponent, JSX, useContext } from 'react';
import { sourceSchemaConfig } from '../../../models/camel';
import { EntitiesContext } from '../../../providers/entities.provider';
import './ContextToolbar.scss';
import { FlowClipboard } from './FlowClipboard/FlowClipboard';
import { ExportDocument } from './ExportDocument/ExportDocument';
import { FlowExportImage } from './FlowExportImage/FlowExportImage';
import { FlowsMenu } from './Flows/FlowsMenu';
import { NewEntity } from './NewEntity/NewEntity';
import { RuntimeSelector } from './RuntimeSelector/RuntimeSelector';
import { RedoIcon, UndoIcon } from '@patternfly/react-icons';
import { useStore } from 'zustand';
import { useSourceCodeStore } from '../../../store';

export const ContextToolbar: FunctionComponent<{ additionalControls?: JSX.Element[] }> = ({ additionalControls }) => {
  const { currentSchemaType } = useContext(EntitiesContext)!;
  const isMultipleRoutes = sourceSchemaConfig.config[currentSchemaType].multipleRoute;
  const { undo, redo, pastStates, futureStates } = useStore(useSourceCodeStore.temporal, (state) => state);

  const toolbarItems: JSX.Element[] = [
    <ToolbarItem key="toolbar-flows-list">
      <FlowsMenu />
    </ToolbarItem>,
  ];

  if (isMultipleRoutes) {
    toolbarItems.push(
      <ToolbarItem key="toolbar-new-route">
        <NewEntity />
      </ToolbarItem>,
    );
  }
  //Currently adding only SerializerSelector at the beginning of the toolbar,
  if (additionalControls) {
    additionalControls.forEach((control) => toolbarItems.unshift(control));
  }

  return (
    <Toolbar className="context-toolbar">
      <ToolbarContent>
        {toolbarItems.concat([
          <ToolbarItem key="toolbar-undo">
            <Button
              aria-label="Undo"
              title="Undo"
              variant="plain"
              isDisabled={pastStates.length === 0}
              onClick={() => {
                undo();
              }}
            >
              <UndoIcon />
            </Button>
          </ToolbarItem>,
          <ToolbarItem key="toolbar-redo">
            <Button
              aria-label="Redo"
              title="Redo"
              variant="plain"
              isDisabled={futureStates.length === 0}
              onClick={() => {
                redo();
              }}
            >
              <RedoIcon />
            </Button>
          </ToolbarItem>,
          <ToolbarItem key="toolbar-clipboard">
            <FlowClipboard />
          </ToolbarItem>,
          <ToolbarItem key="toolbar-export-image">
            <FlowExportImage />
          </ToolbarItem>,
          <ToolbarItem key="toolbar-export-document">
            <ExportDocument />
          </ToolbarItem>,

          <RuntimeSelector key="runtime-selector" />,
        ])}
      </ToolbarContent>
    </Toolbar>
  );
};
