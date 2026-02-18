import react from '@vitejs/plugin-react';
import { dirname, relative } from 'node:path';
import { defineConfig, normalizePath } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { getCatalogFiles } from './scripts/get-catalog-files.mjs';

export default defineConfig(() => {
  const { basePath, files: catalogFiles } = getCatalogFiles();

  return {
    plugins: [
      react(),
      viteStaticCopy({
        targets: catalogFiles.map((file) => {
          const normalizedFile = normalizePath(file);
          const relativePath = relative(basePath, file);
          const dest = normalizePath('./' + dirname(relativePath));

          return {
            src: normalizedFile,
            dest,
            transform: (content, filename) => {
              if (filename.endsWith('.xsd')) {
                return content;
              }
              return JSON.stringify(JSON.parse(content));
            },
          };
        }),
      }),
    ],
    build: {
      outDir: './dist',
      sourcemap: true,
      emptyOutDir: true,
    },
    base: './',
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },
    resolve: {
      alias: [
        {
          find: /^~.+/,
          replacement: (val: string) => val.replace(/^~/, ''),
        },
      ],
    },
  };
});
