/**
 * Kaoto Web MVP
 *
 * Validates that the multiplying architecture works on the web by:
 * 1. Creating a web envelope context (direct in-memory channel, no postMessage)
 * 2. Using KaotoEditorFactory.createEditor() - the same factory used by VS Code Kaoto
 * 3. Rendering editor.af_componentRoot() - the full Kaoto React component tree
 * 4. Loading a hardcoded Camel route via editor.setContent()
 */
import '@patternfly/react-core/dist/styles/base.css';

import { KaotoEditorFactory } from '@kaoto/kaoto';
import { ChannelType } from '@kie-tools-core/editor/dist/api';
import type { Editor, EditorInitArgs } from '@kie-tools-core/editor/dist/api';
import { createRoot } from 'react-dom/client';

import { createWebEnvelopeContext } from './channel/createWebEnvelopeContext';

const SAMPLE_ROUTE = `- route:
    id: sample-route
    from:
      uri: timer:hello
      parameters:
        period: "1000"
      steps:
        - setBody:
            simple: "Hello from Kaoto Web!"
        - log:
            message: "\${body}"
`;

async function main() {
  const container = document.getElementById('root')!;
  const root = createRoot(container);

  let editor: Editor | undefined;

  const envelopeContext = createWebEnvelopeContext({
    onReady: () => {
      console.log('[KaotoWeb] Editor signaled ready, setting content...');
      editor?.setContent('sample-route.camel.yaml', SAMPLE_ROUTE);
    },
    onNewEdit: () => {
      // MVP: just log edits
      console.log('[KaotoWeb] Editor produced a new edit');
    },
  });

  const initArgs: EditorInitArgs = {
    resourcesPathPrefix: '',
    fileExtension: 'yaml',
    initialLocale: 'en',
    isReadOnly: false,
    channel: ChannelType.ONLINE,
    workspaceRootAbsolutePosixPath: '/',
  };

  const factory = new KaotoEditorFactory();
  editor = await factory.createEditor(envelopeContext, initArgs);

  // Call af_onOpen lifecycle hook (sets color scheme)
  editor.af_onOpen?.();

  // Render the editor's React component tree
  const editorElement = editor.af_componentRoot();
  root.render(
    <div style={{ width: '100vw', height: '100vh' }}>
      {editorElement as React.ReactElement}
    </div>,
  );
}

main().catch(console.error);
