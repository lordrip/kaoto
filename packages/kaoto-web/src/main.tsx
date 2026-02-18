/**
 * Kaoto Web
 *
 * Uses the multiplying architecture to run the Kaoto visual editor
 * in a standalone browser tab with a route selection sidebar.
 */
import '@patternfly/react-core/dist/styles/base.css';

import { KaotoEditorFactory } from '@kaoto/kaoto';
import { ChannelType } from '@kie-tools-core/editor/dist/api';
import type { Editor, EditorInitArgs } from '@kie-tools-core/editor/dist/api';
import { createRoot } from 'react-dom/client';

import { createWebEnvelopeContext } from './channel/createWebEnvelopeContext';
import { App } from './components/App';
import { sampleRoutes } from './sampleRoutes';

async function main() {
  const container = document.getElementById('root')!;
  const root = createRoot(container);

  const envelopeContext = createWebEnvelopeContext();

  const initArgs: EditorInitArgs = {
    resourcesPathPrefix: '',
    fileExtension: 'yaml',
    initialLocale: 'en',
    isReadOnly: false,
    channel: ChannelType.ONLINE,
    workspaceRootAbsolutePosixPath: '/',
  };

  const factory = new KaotoEditorFactory();
  const editor: Editor = await factory.createEditor(envelopeContext, initArgs);

  editor.af_onOpen?.();

  root.render(
    <App
      editor={editor}
      routes={sampleRoutes}
    />,
  );
}

main().catch(console.error);
