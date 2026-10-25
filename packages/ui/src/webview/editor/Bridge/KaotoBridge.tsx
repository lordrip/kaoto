import { SuggestionRegistryProvider } from '@kaoto/forms';
import { VisualizationProvider } from '@patternfly/react-topology';
import { FunctionComponent, PropsWithChildren, useEffect, useMemo } from 'react';

import { NodeInteractionAddonProvider } from '../../../components/registers/interactions/node-interaction-addon.provider';
import { RegisterComponents } from '../../../components/registers/RegisterComponents';
import { RegisterNodeInteractionAddons } from '../../../components/registers/RegisterNodeInteractionAddons';
import { RenderingProvider } from '../../../components/RenderingAnchor/rendering.provider';
import { ControllerService } from '../../../components/Visualization/Canvas/controller.service';
import { CatalogTilesProvider } from '../../../dynamic-catalog/catalog-tiles.provider';
import { useUndoRedo } from '../../../hooks/undo-redo.hook';
import { IMetadataApi, MetadataProvider, VisibleFlowsProvider } from '../../../providers';
import type { LocalHistory } from './editor-document';

interface KaotoBridgeProps extends IMetadataApi {
  /** Signal that the editor tree is mounted. */
  onReady: () => void;
  /** Receives the canvas undo/redo actions, which need the visualization controller created here. */
  onHistory?: (history: LocalHistory | undefined) => void;
}

/** Registers the canvas history with the host document binding. Must render inside the VisualizationProvider. */
const HistoryRegistration: FunctionComponent<{ onHistory: (history: LocalHistory | undefined) => void }> = ({
  onHistory,
}) => {
  const { undo, redo } = useUndoRedo();
  useEffect(() => {
    onHistory({ undo, redo });
    return () => {
      onHistory(undefined);
    };
  }, [onHistory, undo, redo]);
  return null;
};

export const KaotoBridge: FunctionComponent<PropsWithChildren<KaotoBridgeProps>> = ({
  onReady,
  onHistory,
  children,
  getMetadata,
  setMetadata,
  getResourceContent,
  saveResourceContent,
  isResourceExist,
  deleteResource,
  askUserForFileSelection,
  getSuggestions,
  shouldSaveSchema,
  onStepUpdated,
}) => {
  const controller = useMemo(() => ControllerService.createController(), []);
  const metadataApi: IMetadataApi = useMemo(
    () => ({
      getMetadata,
      setMetadata,
      getResourceContent,
      saveResourceContent,
      isResourceExist,
      deleteResource,
      askUserForFileSelection,
      getSuggestions,
      shouldSaveSchema,
      onStepUpdated,
    }),
    [
      getMetadata,
      setMetadata,
      getResourceContent,
      saveResourceContent,
      isResourceExist,
      deleteResource,
      askUserForFileSelection,
      getSuggestions,
      shouldSaveSchema,
      onStepUpdated,
    ],
  );

  /** Set editor as Ready */
  useEffect(() => {
    onReady();
  }, [onReady]);

  return (
    <CatalogTilesProvider>
      <VisualizationProvider controller={controller}>
        <VisibleFlowsProvider>
          {onHistory && <HistoryRegistration onHistory={onHistory} />}
          <RenderingProvider>
            <MetadataProvider api={metadataApi}>
              <RegisterComponents>
                <NodeInteractionAddonProvider>
                  <RegisterNodeInteractionAddons>
                    <SuggestionRegistryProvider>{children}</SuggestionRegistryProvider>
                  </RegisterNodeInteractionAddons>
                </NodeInteractionAddonProvider>
              </RegisterComponents>
            </MetadataProvider>
          </RenderingProvider>
        </VisibleFlowsProvider>
      </VisualizationProvider>
    </CatalogTilesProvider>
  );
};
