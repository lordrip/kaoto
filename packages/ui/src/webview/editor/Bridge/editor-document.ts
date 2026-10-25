import { BridgeError, IEventBus, SetContentRequest } from '../../../host-bridge/contracts';
import type { SourceCodeAdapter, SourceDocument } from '../../../providers/source-code.provider';
import { useSourceCodeStore } from '../../../store';

export interface EditorDocumentState {
  initialized: boolean;
  readonly: boolean;
  nativeUndoRedo?: boolean;
  historyPending?: boolean;
  error?: Error;
}

export interface LocalHistory {
  undo: () => void;
  redo: () => void;
}

/**
 * Binds the host document protocol to the source code store.
 *
 * The returned `adapter` plugs into the SourceCodeProvider: host content flows in through `subscribe`,
 * editor changes flow out through `onChange`. Everything else is delivery metadata (revision, readiness, history).
 */
export function bindEditorDocument(bus: IEventBus) {
  let state: EditorDocumentState = { initialized: false, readonly: true };
  let disposed = false;
  let announced = false;
  let applyingHostContent = false;
  let revision = 0;
  let apply: ((document: SourceDocument) => void) | undefined;
  let localHistory: LocalHistory | undefined;
  let initializationTimer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();

  const updateState = (next: EditorDocumentState) => {
    state = next;
    listeners.forEach((listener) => {
      listener();
    });
  };
  const requireReady = (initializing = false) => {
    if (disposed) throw new BridgeError('DISPOSED', 'The editor document has been disposed');
    if (state.error) throw state.error;
    if (!apply || (!initializing && !state.initialized)) {
      throw new BridgeError('NOT_READY', 'The editor document is not initialized');
    }
    return apply;
  };
  const failInitialization = (error: unknown) => {
    if (state.initialized || disposed) return;
    clearTimeout(initializationTimer);
    updateState({
      ...state,
      error: error instanceof Error ? error : new BridgeError('INTERNAL_ERROR', 'Could not initialize the document'),
    });
  };
  const setContent = (request: SetContentRequest, signal: AbortSignal) => {
    const applyContent = requireReady(request.reason === 'init');
    if (request.reason === 'init' && state.initialized) return { applied: false, revision };
    if (request.reason === 'saveEcho') {
      if (request.revision > revision)
        throw new BridgeError('INVALID_MESSAGE', 'Save echo refers to a future revision');
      return { applied: false, revision };
    }
    // Identical content would only regenerate the Camel resource and disconnect any open form.
    if (state.initialized && useSourceCodeStore.getState().sourceCode === request.content) {
      return { applied: false, revision };
    }
    if (signal.aborted) throw new BridgeError('CANCELLED', 'The document request was cancelled');
    applyingHostContent = true;
    try {
      applyContent({ code: request.content, path: request.fileUri });
      if (request.reason === 'init') {
        clearTimeout(initializationTimer);
        updateState({ initialized: true, readonly: request.readonly, nativeUndoRedo: request.nativeUndoRedo });
      } else {
        revision++;
      }
      return { applied: true, revision };
    } catch (error) {
      failInitialization(error);
      throw error;
    } finally {
      applyingHostContent = false;
    }
  };
  const notifyChange = (content: string) => {
    if (disposed || !state.initialized || state.readonly || state.error || applyingHostContent) return;
    revision++;
    bus.emit('editor:document:changed', { content, revision });
  };
  const unsubscribers = [
    bus.onRequest('editor:document:setContent', (request, { signal }) => setContent(request, signal)),
    bus.onRequest('editor:document:getContent', () => {
      requireReady();
      return { content: useSourceCodeStore.getState().sourceCode, revision };
    }),
    bus.onRequest('editor:document:validate', () => ({ notifications: [] })),
    bus.onRequest('editor:preview:get', () => ({ svg: null })),
    bus.onRequest('editor:undoRedo:apply', ({ command }) => {
      requireReady();
      if (state.readonly) throw new BridgeError('NOT_READY', 'The editor document is read-only');
      if (state.nativeUndoRedo) throw new BridgeError('UNSUPPORTED_REQUEST', 'The host owns document history');
      if (!localHistory) throw new BridgeError('NOT_READY', 'The editor history is not available');
      localHistory[command]();
      return null;
    }),
  ];

  const adapter: SourceCodeAdapter = {
    subscribe(next) {
      apply = next;
      return () => {
        if (apply === next) apply = undefined;
      };
    },
    onChange: notifyChange,
  };

  return {
    adapter,
    getState: () => state,
    /** `useSyncExternalStore` subscription */
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setLocalHistory(history: LocalHistory | undefined) {
      localHistory = history;
    },
    async applyHistory(command: 'undo' | 'redo') {
      requireReady();
      if (!state.nativeUndoRedo || state.readonly || state.historyPending) {
        throw new BridgeError('NOT_READY', 'Host history is not available');
      }
      updateState({ ...state, historyPending: true });
      try {
        await bus.request('host:undoRedo:apply', { command, revision });
      } finally {
        updateState({ ...state, historyPending: false });
      }
    },
    ready() {
      requireReady(true);
      if (announced) return;
      announced = true;
      if (!state.initialized) {
        initializationTimer = setTimeout(() => {
          updateState({
            ...state,
            error: new BridgeError('TIMEOUT', 'The host did not initialize the document. Please retry.'),
          });
        }, 5_000);
      }
      bus.emit('editor:ready', null);
    },
    suspend(error: Error) {
      clearTimeout(initializationTimer);
      updateState({ ...state, error });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      clearTimeout(initializationTimer);
      unsubscribers.forEach((unsubscribe) => {
        unsubscribe();
      });
      updateState({ ...state, error: new BridgeError('DISPOSED', 'The editor document has been disposed') });
    },
  };
}
