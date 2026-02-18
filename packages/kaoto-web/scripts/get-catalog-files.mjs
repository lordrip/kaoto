/**
 * Discovers and lists Camel Catalog files from @kaoto/camel-catalog.
 * Adapted from packages/ui/scripts/get-catalog-files.mjs for standalone use.
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { normalizePath } from 'vite';

const require = createRequire(import.meta.url);

export const getCatalogFiles = () => {
  let camelCatalogPath = '';

  try {
    const camelCatalogIndexJsonPath = require.resolve('@kaoto/camel-catalog/index.json');
    camelCatalogPath = normalizePath(dirname(camelCatalogIndexJsonPath));
  } catch (error) {
    throw new Error(`Could not find '@kaoto/camel-catalog' \n\n ${error}`);
  }

  if (readdirSync(camelCatalogPath).length === 0) {
    throw new Error(`The '${camelCatalogPath}' folder is empty.`);
  }

  console.info(`Found Camel Catalog at ${camelCatalogPath}`, '\n');

  const catalogFiles = [];
  getFilesRecursively(camelCatalogPath, catalogFiles);

  const basePath = normalizePath(dirname(require.resolve('@kaoto/camel-catalog')));

  return {
    basePath,
    files: catalogFiles.filter((file) => file.endsWith('.json') || file.endsWith('.xsd')),
  };
};

function getFilesRecursively(source, files) {
  const exists = existsSync(source);
  const stats = exists && statSync(source);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    for (const file of readdirSync(source)) {
      getFilesRecursively(join(source, file), files);
    }
  } else {
    files.push(source);
  }
}
