import { FunctionComponent, useContext, useEffect, useLayoutEffect } from 'react';
import { Visualization } from '../../components/Visualization';
import { useReload } from '../../hooks/reload.hook';
import {
  CatalogLoaderProvider,
  EntitiesContext,
  EntitiesProvider,
  RuntimeProvider,
  SchemasLoaderProvider,
  VisibleFlowsContext,
  VisibleFlowsProvider,
} from '../../providers';
import { EventNotifier } from '../../utils';

const VisibleFlowsVisualization: FunctionComponent = () => {
  const { visibleFlows, visualFlowsApi } = useContext(VisibleFlowsContext)!;
  const entitiesContext = useContext(EntitiesContext);
  const visualEntities = entitiesContext?.visualEntities ?? [];

  useEffect(() => {
    visualFlowsApi.showAllFlows();
  }, [visibleFlows, visualFlowsApi]);

  return <Visualization entities={visualEntities} />;
};

const Viz: FunctionComponent<{ catalogUrl: string }> = ({ catalogUrl }) => {
  const ReloadProvider = useReload();

  return (
    <ReloadProvider>
      <RuntimeProvider catalogUrl={catalogUrl}>
        <SchemasLoaderProvider>
          <CatalogLoaderProvider>
            <VisibleFlowsProvider>
              <VisibleFlowsVisualization />
            </VisibleFlowsProvider>
          </CatalogLoaderProvider>
        </SchemasLoaderProvider>
      </RuntimeProvider>
    </ReloadProvider>
  );
};

export const RouteVisualization: FunctionComponent<{
  catalogUrl: string;
  code: string;
  codeChange: (code: string) => void;
}> = ({ catalogUrl, code, codeChange }) => {
  const eventNotifier = EventNotifier.getInstance();

  useLayoutEffect(() => {
    return eventNotifier.subscribe('entities:updated', (code: string) => {
      codeChange(code);
    });
  }, [eventNotifier, codeChange]);

  useEffect(() => {
    eventNotifier.next('code:updated', code);
  }, [code, eventNotifier]);

  return (
    <EntitiesProvider>
      <Viz catalogUrl={catalogUrl} />
    </EntitiesProvider>
  );
};
