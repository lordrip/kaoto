import { Page, PageSection } from '@patternfly/react-core';
import type { Editor } from '@kie-tools-core/editor/dist/api';
import { useCallback, useRef, useState } from 'react';

import type { SampleRoute } from '../sampleRoutes';
import { RouteSidebar } from './RouteSidebar';

interface AppProps {
  editor: Editor;
  routes: SampleRoute[];
}

export function App({ editor, routes }: AppProps) {
  const [selectedRoute, setSelectedRoute] = useState<SampleRoute | undefined>();
  const isLoadingRef = useRef(false);

  const handleSelectRoute = useCallback(
    async (route: SampleRoute) => {
      if (isLoadingRef.current || route.filename === selectedRoute?.filename) return;

      isLoadingRef.current = true;
      setSelectedRoute(route);

      try {
        await editor.setContent(route.filename, route.content);
      } catch (err) {
        console.error('[KaotoWeb] Failed to set content:', err);
      } finally {
        isLoadingRef.current = false;
      }
    },
    [editor, selectedRoute],
  );

  const sidebar = (
    <RouteSidebar
      routes={routes}
      selectedRoute={selectedRoute}
      onSelectRoute={handleSelectRoute}
    />
  );

  return (
    <Page sidebar={sidebar}>
      <PageSection isFilled hasOverflowScroll padding={{ default: 'noPadding' }}>
        <div style={{ width: '100%', height: '100%' }}>
          {editor.af_componentRoot() as React.ReactElement}
        </div>
      </PageSection>
    </Page>
  );
}
