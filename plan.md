# Kaoto Web Wrapper - Implementation Plan

## Goal
Create a web wrapper that leverages the same Kaoto editor used in VS Code Kaoto via the "multiplying architecture", with multi-file support (in-memory files shown in a sidebar list, clicking each opens it in the editor), similar to the Serverless Logic Web Tools experience.

## Background

### How the Multiplying Architecture Works
The Kaoto UI library (`@kaoto/kaoto`) exports two key things:
- **`KaotoEditorFactory`** - Creates `KaotoEditorApp` instances given an envelope context
- **`KaotoEditorChannelApi`** - The interface the host must implement (settings, file operations, metadata)

In VS Code Kaoto, the editor runs inside a webview (the "envelope") and VS Code acts as the "channel", communicating via `postMessage`. The `KaotoEditorApp` implements the `Editor` interface from `@kie-tools-core/editor` with methods like `setContent(path, content)`, `getContent()`, and `af_componentRoot()` (which returns the full React component tree).

### What We Need for Web
In a web context, we don't need the iframe/postMessage boundary. Instead, we create a **lightweight mock of the `KogitoEditorEnvelopeContextType`** that provides the same `channelApi` but backed by in-memory state. This way we reuse the exact same `KaotoEditorFactory` and `KaotoEditorApp` as VS Code, fulfilling the multiplying architecture contract.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Web Wrapper (packages/kaoto-web)                        │
│                                                          │
│  ┌──────────┐  ┌──────────────────────────────────────┐  │
│  │ File     │  │  Editor Area                         │  │
│  │ Sidebar  │  │                                      │  │
│  │          │  │  KaotoEditorApp.af_componentRoot()   │  │
│  │ route.   │  │  ┌──────────────────────────────┐    │  │
│  │ camel.   │──│──│ Design │ Beans │ Metadata│...│    │  │
│  │ yaml     │  │  └──────────────────────────────┘    │  │
│  │          │  │  ┌──────────────────────────────┐    │  │
│  │ my.      │  │  │                              │    │  │
│  │ kamelet. │  │  │  Visual Canvas / Form Editor │    │  │
│  │ yaml     │  │  │                              │    │  │
│  │          │  │  └──────────────────────────────┘    │  │
│  │ + New    │  │                                      │  │
│  └──────────┘  └──────────────────────────────────────┘  │
│                                                          │
│  WebEditorChannelApi (in-memory implementation)          │
│  ├── getVSCodeKaotoSettings() → DefaultSettingsAdapter   │
│  ├── getMetadata/setMetadata → localStorage              │
│  ├── getResourceContent() → in-memory file store         │
│  └── saveResourceContent() → in-memory file store        │
└──────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Create package scaffolding
Create `packages/kaoto-web/` with:
- `package.json` - workspace package with dependencies on `@kaoto/kaoto`, `@kaoto/camel-catalog`, PatternFly, React, and the `@kie-tools-core/*` packages
- `tsconfig.json` - TypeScript config
- `vite.config.mts` - Vite config with React plugin and catalog file copying (similar to `packages/ui/vite.config.mjs`)
- `index.html` - HTML entry point

### Step 2: Implement the in-memory file store
Create `src/files/filesStore.ts`:
- Zustand store holding `Record<string, { name: string; content: string }>`
- Track `activeFilePath: string`
- Actions: `setActiveFile(path)`, `updateFileContent(path, content)`, `addFile(name, content)`, `deleteFile(path)`

Create `src/files/sampleFiles.ts`:
- 3 sample files pre-loaded:
  1. A Camel Route YAML (`my-route.camel.yaml`) with a timer-to-log route
  2. A Kamelet YAML (`my-source.kamelet.yaml`) with a simple source
  3. A Pipe YAML (`my-pipe.pipe.yaml`) connecting source to sink

### Step 3: Implement the web channel API
Create `src/channel/WebEditorChannelApi.ts`:
- Class implementing `KaotoEditorChannelApi` interface
- `getVSCodeKaotoSettings()` → returns settings with `catalogUrl` pointing to `./camel-catalog/index.json`
- `getCatalogURL()` → returns `./camel-catalog/index.json`
- `getMetadata(key)` / `setMetadata(key, value)` → backed by `localStorage`
- `getResourceContent(path)` → looks up in the files store
- `saveResourceContent(path, content)` → writes to the files store
- `deleteResource(path)` → removes from the files store
- `getResourcesContentByType()` → filters files store by extension
- Others (`getSuggestions`, `getRuntimeInfoFromMavenContext`, etc.) → return empty/undefined defaults

Create `src/channel/createWebEnvelopeContext.ts`:
- Creates a mock `KogitoEditorEnvelopeContextType<KaotoEditorChannelApi>` where:
  - `channelApi.requests` → the `WebEditorChannelApi` instance methods (direct calls, no postMessage)
  - `channelApi.notifications` → lightweight `NotificationConsumer` mocks with `subscribe`/`unsubscribe`/`send` methods that dispatch events (e.g., `kogitoEditor_ready.send()` triggers a callback we can listen to)
  - `channelApi.shared` → provides `kogitoEditor_theme` as a `SharedValueConsumer` with a default light theme
  - `services` → no-op keyboard shortcuts service and i18n service

### Step 4: Implement the main web app
Create `src/WebApp.tsx`:
- On mount: creates `KaotoEditorFactory`, calls `createEditor(envelopeContext, initArgs)` to get a `KaotoEditorApp`
- Renders `editor.af_componentRoot()` in the editor area
- Renders the `FileList` sidebar component
- When the editor signals ready (via the notification), calls `editor.setContent(activeFilePath, activeFileContent)` to load the initial file

Create `src/components/FileList.tsx`:
- PatternFly `SimpleList` or `Nav` component showing all files from the Zustand store
- Clicking a file:
  1. Calls `editor.getContent()` to capture current edits
  2. Updates the store with the captured content for the previous file
  3. Switches active file in the store
  4. Calls `editor.setContent(newPath, newContent)` to load the new file
- A "New File" button at the bottom that opens a name input and creates a new empty Camel Route file
- Delete button per file (with confirmation)
- Visual indication of the active file

Create `src/WebApp.scss`:
- Flexbox layout: sidebar (fixed width ~250px) + editor area (flex-grow)
- Full viewport height

Create `src/main.tsx`:
- Entry point that renders `<WebApp />` into `#root`

### Step 5: Wire up the build
- `vite.config.mts` copies catalog files from `@kaoto/camel-catalog` (same approach as `packages/ui/vite.config.mjs`)
- Add `packages/kaoto-web` to the root `workspaces` (already covered since root uses `packages/*`)
- Add scripts: `start`, `build`, `preview`

### Step 6: Handle file change notifications
- When the editor sends `kogitoWorkspace_newEdit` notification (user made an edit), auto-save the content to the in-memory store
- This ensures content is preserved even without explicit save

## Key Files to Create

| File | Purpose |
|------|---------|
| `packages/kaoto-web/package.json` | Package manifest with dependencies |
| `packages/kaoto-web/tsconfig.json` | TypeScript config |
| `packages/kaoto-web/vite.config.mts` | Vite build config with catalog copy |
| `packages/kaoto-web/index.html` | HTML entry point |
| `packages/kaoto-web/src/main.tsx` | React entry point |
| `packages/kaoto-web/src/WebApp.tsx` | Main app: sidebar + editor layout |
| `packages/kaoto-web/src/WebApp.scss` | Layout styles |
| `packages/kaoto-web/src/channel/WebEditorChannelApi.ts` | In-memory channel API implementation |
| `packages/kaoto-web/src/channel/createWebEnvelopeContext.ts` | Mock envelope context factory |
| `packages/kaoto-web/src/files/filesStore.ts` | Zustand file store |
| `packages/kaoto-web/src/files/sampleFiles.ts` | Sample Camel files |
| `packages/kaoto-web/src/components/FileList.tsx` | File list sidebar component |
| `packages/kaoto-web/src/components/FileList.scss` | File list styles |

## Dependencies

The new package needs:
- `@kaoto/kaoto` (workspace dependency) - the editor library
- `@kaoto/camel-catalog` - the Camel catalog data
- `@kie-tools-core/editor` - for types (`KogitoEditorEnvelopeContextType`, `EditorInitArgs`, etc.)
- `@kie-tools-core/envelope-bus` - for `MessageBusClientApi` types
- `@kie-tools-core/keyboard-shortcuts` - for `NoOpKeyboardShortcutsService` or equivalent
- `@kie-tools-core/i18n` - for `I18nService`
- `@kie-tools-core/notifications` - for `Notification` type
- `@kie-tools-core/workspace` - for `WorkspaceEdit` type
- PatternFly packages (react-core, patternfly, react-icons)
- React, React DOM
- Zustand
- Vite + @vitejs/plugin-react
- TypeScript, sass-embedded

## Risks and Mitigations

1. **Mock envelope context complexity**: The `MessageBusClientApi` type system uses conditional types to split methods into requests/notifications/shared. Mitigation: We build the mock carefully matching the type signatures, using `as unknown as MessageBusClientApi<KaotoEditorChannelApi>` only if necessary.

2. **Catalog loading**: The Camel catalog must be served as static files. Mitigation: Copy them via vite-plugin-static-copy, same as the existing web app.

3. **Editor singleton**: `KaotoEditorApp` uses singleton patterns (`EditService`, `EventNotifier`). Mitigation: When switching files, we use `setContent`/`getContent` as designed - these handle stale edit detection and content sync correctly.

4. **First render timing**: The editor needs the catalog loaded before it can render. Mitigation: The `RuntimeProvider` already handles async catalog loading with loading states.
