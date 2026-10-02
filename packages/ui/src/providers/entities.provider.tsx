import { createContext, FunctionComponent, PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';

import { useKaotoResourceContext } from '../hooks/useKaotoResourceContext/useKaotoResourceContext';
import { BaseVisualEntity } from '../models';
import { SourceSchemaType } from '../models/camel';
import { BaseEntity } from '../models/entities';
import { KaotoResource } from '../models/kaoto-resource';
import { EventNotifier } from '../utils';

export interface EntitiesContextResult {
  entities: BaseEntity[];
  currentSchemaType: SourceSchemaType;
  visualEntities: BaseVisualEntity[];
  camelResource: KaotoResource;

  /**
   * Notify that a property in an entity has changed, hence the source
   * code needs to be updated
   *
   * NOTE: This process shouldn't recreate the CamelResource neither
   * the entities, just the source code
   */
  updateSourceCodeFromEntities: () => void;

  /**
   * Refresh the entities from the Camel Resource, and
   * notify subscribers that a `entities:updated` happened
   *
   * NOTE: This process shouldn't recreate the CamelResource,
   * just the entities
   */
  updateEntitiesFromCamelResource: () => void;
}

export const EntitiesContext = createContext<EntitiesContextResult | null>(null);

interface EntitiesSnapshot {
  resource: KaotoResource;
  entities: BaseEntity[];
  visualEntities: BaseVisualEntity[];
}

export const EntitiesProvider: FunctionComponent<PropsWithChildren> = ({ children }) => {
  const eventNotifier = EventNotifier.getInstance();

  const { kaotoResource } = useKaotoResourceContext();
  const [snapshot, setSnapshot] = useState<EntitiesSnapshot>();
  const activeSnapshot = useMemo<EntitiesSnapshot>(
    () => snapshot ?? { resource: kaotoResource, entities: [], visualEntities: [] },
    [snapshot, kaotoResource],
  );

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        await kaotoResource.initialize();
        if (cancelled) return;
        setSnapshot({
          resource: kaotoResource,
          entities: kaotoResource.getEntities(),
          visualEntities: kaotoResource.getVisualEntities(),
        });
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to initialize KaotoResource', error);
        setSnapshot({ resource: kaotoResource, entities: [], visualEntities: [] });
      }
    };
    void init();

    return () => {
      cancelled = true;
    };
  }, [kaotoResource]);

  const updateSourceCodeFromEntities = useCallback(() => {
    void activeSnapshot.resource.toSourceCode().then((code) => {
      eventNotifier.next('entities:updated', code);
    });
  }, [activeSnapshot.resource, eventNotifier]);

  const updateEntitiesFromCamelResource = useCallback(() => {
    const resource = activeSnapshot.resource;
    setSnapshot({ resource, entities: resource.getEntities(), visualEntities: resource.getVisualEntities() });

    /**
     * Notify consumers that entities has been refreshed, hence the code needs to be updated
     */
    updateSourceCodeFromEntities();
  }, [activeSnapshot.resource, updateSourceCodeFromEntities]);

  const value = useMemo(
    () => ({
      entities: activeSnapshot.entities,
      visualEntities: activeSnapshot.visualEntities,
      currentSchemaType: activeSnapshot.resource.getType(),
      camelResource: activeSnapshot.resource,
      updateEntitiesFromCamelResource,
      updateSourceCodeFromEntities,
    }),
    [activeSnapshot, updateEntitiesFromCamelResource, updateSourceCodeFromEntities],
  );

  return <EntitiesContext.Provider value={value}>{children}</EntitiesContext.Provider>;
};
