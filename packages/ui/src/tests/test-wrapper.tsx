import { FunctionComponent, PropsWithChildren } from 'react';

import { MappingLinksProvider } from '../providers/data-mapping-links.provider';
import { DataMapperProvider } from '../providers/datamapper.provider';

/**
 * Test wrapper that provides all necessary contexts for DataMapper components
 * Use this wrapper when testing components that use useMappingLinks or useDataMapper hooks
 */
export const DataMapperTestWrapper: FunctionComponent<PropsWithChildren> = ({ children }) => (
  <DataMapperProvider>
    <MappingLinksProvider>{children}</MappingLinksProvider>
  </DataMapperProvider>
);
