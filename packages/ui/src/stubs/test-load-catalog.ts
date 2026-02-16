import { CatalogLibrary, CatalogLibraryEntry, KaotoFunction } from '@kaoto/camel-catalog/types';

import {
  CamelCatalogIndex,
  ICamelComponentDefinition,
  ICamelDataformatDefinition,
  ICamelLanguageDefinition,
  ICamelLoadBalancerDefinition,
  ICamelProcessorDefinition,
  IKameletDefinition,
} from '../models';

/**
 * Unwrap Vite's JSON module format.
 * Vite imports JSON as `{ default: <fullJson>, ...partialKeys }`.
 * The `default` property always contains the complete JSON, while
 * direct keys may only contain a subset.
 */
function unwrapDefault<T>(mod: T & { default?: T }): T {
  if (mod.default && typeof mod.default === 'object') {
    return mod.default as T;
  }
  return mod;
}

export const getFirstCatalogMap = async (catalogLibrary: CatalogLibrary) => {
  const [firstCatalogLibraryEntry] = catalogLibrary.definitions;

  return await testLoadCatalog(firstCatalogLibraryEntry as CatalogLibraryEntry);
};

export const testLoadCatalog = async (catalogLibraryEntry: CatalogLibraryEntry) => {
  const catalogDefinition: CamelCatalogIndex = (await import(`@kaoto/camel-catalog/${catalogLibraryEntry.fileName}`))
    .default;

  const catalogPath = `@kaoto/camel-catalog/${catalogLibraryEntry.fileName.substring(0, catalogLibraryEntry.fileName.lastIndexOf('/') + 1)}`;

  const componentCatalogMap = unwrapDefault<Record<string, ICamelComponentDefinition>>(
    await import(`${catalogPath}${catalogDefinition.catalogs.components.file}`),
  );

  const modelCatalogMap = unwrapDefault<Record<string, ICamelProcessorDefinition>>(
    await import(`${catalogPath}${catalogDefinition.catalogs.models.file}`),
  );

  const patternCatalogMap = unwrapDefault<Record<string, ICamelProcessorDefinition>>(
    await import(`${catalogPath}${catalogDefinition.catalogs.patterns.file}`),
  );

  const kameletsCatalogMap = unwrapDefault<Record<string, IKameletDefinition>>(
    await import(`${catalogPath}${catalogDefinition.catalogs.kamelets.file}`),
  );

  const kameletsBoundariesCatalog = unwrapDefault<Record<string, IKameletDefinition>>(
    await import(`${catalogPath}${catalogDefinition.catalogs.kameletBoundaries.file}`),
  );

  const languageCatalog = unwrapDefault<Record<string, ICamelLanguageDefinition>>(
    await import(`${catalogPath}${catalogDefinition.catalogs.languages.file}`),
  );

  const dataformatCatalog = unwrapDefault<Record<string, ICamelDataformatDefinition>>(
    await import(`${catalogPath}${catalogDefinition.catalogs.dataformats.file}`),
  );

  const loadbalancerCatalog = unwrapDefault<Record<string, ICamelLoadBalancerDefinition>>(
    await import(`${catalogPath}${catalogDefinition.catalogs.loadbalancers.file}`),
  );

  const entitiesCatalog = unwrapDefault<Record<string, ICamelProcessorDefinition>>(
    await import(`${catalogPath}${catalogDefinition.catalogs.entities.file}`),
  );

  const functionsCatalogMap = unwrapDefault<Record<string, Record<string, KaotoFunction>>>(
    await import(`${catalogPath}${catalogDefinition.catalogs.functions.file}`),
  );

  return {
    catalogDefinition,
    catalogPath,
    componentCatalogMap,
    modelCatalogMap,
    patternCatalogMap,
    kameletsCatalogMap,
    kameletsBoundariesCatalog,
    languageCatalog,
    dataformatCatalog,
    loadbalancerCatalog,
    entitiesCatalog,
    functionsCatalogMap,
  };
};
