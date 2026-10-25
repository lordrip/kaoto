import { createPostMessageBridge } from '../../../host-bridge/bridge';
import { BridgeError, IEventBus } from '../../../host-bridge/contracts';
import { createEventBus } from '../../../host-bridge/event-bus';
import { createMemoryTransports } from '../../../host-bridge/transports/memory';
import type { SourceDocument } from '../../../providers/source-code.provider';
import { useSourceCodeStore } from '../../../store';
import { bindEditorDocument } from './editor-document';

describe('editor document binding', () => {
  let host: IEventBus;
  let editor: IEventBus;
  let binding: ReturnType<typeof bindEditorDocument>;
  let apply: ReturnType<typeof vi.fn<(document: SourceDocument) => void>>;
  const init = {
    reason: 'init',
    fileUri: 'route.camel.yaml',
    content: '',
    isDirty: null,
    readonly: false,
    saveAcknowledgements: false,
  } as const;
  const content = () => useSourceCodeStore.getState().sourceCode;
  /** An edit made in the canvas: the provider updates the store and forwards the change */
  const edit = (next: string) => {
    useSourceCodeStore.getState().setSourceCode(next);
    binding.adapter.onChange?.(next);
  };

  beforeEach(async () => {
    useSourceCodeStore.setState({ sourceCode: '', path: undefined });
    host = createEventBus({ role: 'host', onError: vi.fn() });
    editor = createEventBus({ role: 'editor', onError: vi.fn() });
    const transports = createMemoryTransports();
    await Promise.all([
      createPostMessageBridge({ bus: host, transport: transports.host }).connect(),
      createPostMessageBridge({ bus: editor, transport: transports.editor }).connect(),
    ]);
    // Mirrors the provider: host content lands in the store and would be re-emitted without the guard.
    apply = vi.fn(({ code }: SourceDocument) => {
      useSourceCodeStore.getState().setSourceCode(code);
      binding.adapter.onChange?.(code);
    });
    binding = bindEditorDocument(editor);
    binding.adapter.subscribe(apply);
  });
  afterEach(() => {
    binding?.dispose();
    host.dispose();
    editor.dispose();
  });

  it('reports NOT_READY before the provider subscribes and for snapshots before init', async () => {
    await expect(host.request('editor:document:getContent', null)).rejects.toMatchObject({ code: 'NOT_READY' });
    binding.dispose();
    binding = bindEditorDocument(editor);
    await expect(host.request('editor:document:setContent', init)).rejects.toMatchObject({ code: 'NOT_READY' });
  });

  it('delegates native undo with the current revision without emitting another edit', async () => {
    const changed = vi.fn();
    const applyHistory = vi.fn(async () => null);
    const localHistory = { undo: vi.fn(), redo: vi.fn() };
    host.on('editor:document:changed', changed);
    host.onRequest('host:undoRedo:apply', applyHistory);
    binding.setLocalHistory(localHistory);
    await host.request('editor:document:setContent', { ...init, nativeUndoRedo: true });
    edit('edited');
    await vi.waitFor(() => {
      expect(changed).toHaveBeenCalledOnce();
    });
    changed.mockClear();
    await binding.applyHistory('undo');
    expect(applyHistory).toHaveBeenCalledWith({ command: 'undo', revision: 1 }, expect.anything());
    expect(localHistory.undo).not.toHaveBeenCalled();
    expect(content()).toBe('edited');
    await host.request('editor:document:setContent', { reason: 'hostUpdate', fileUri: init.fileUri, content: '' });
    expect(content()).toBe('');
    expect(changed).not.toHaveBeenCalled();
  });

  it('rejects local history requests in native mode and releases busy state after a host failure', async () => {
    const applyHistory = vi.fn(async () => {
      throw new BridgeError('NOT_READY', 'Another document is active');
    });
    const localHistory = { undo: vi.fn(), redo: vi.fn() };
    host.onRequest('host:undoRedo:apply', applyHistory);
    binding.setLocalHistory(localHistory);
    await host.request('editor:document:setContent', { ...init, nativeUndoRedo: true });
    await expect(host.request('editor:undoRedo:apply', { command: 'undo' })).rejects.toMatchObject({
      code: 'UNSUPPORTED_REQUEST',
    });
    await expect(binding.applyHistory('undo')).rejects.toMatchObject({ code: 'NOT_READY' });
    expect(binding.getState().historyPending).toBe(false);
    expect(localHistory.undo).not.toHaveBeenCalled();
    expect(content()).toBe('');
  });

  it('publishes edits after an empty init and suppresses host changes', async () => {
    const changed = vi.fn();
    host.on('editor:document:changed', changed);
    await expect(host.request('editor:document:setContent', init)).resolves.toEqual({ applied: true, revision: 0 });
    edit('first edit');
    await expect(host.request('editor:document:getContent', null)).resolves.toEqual({
      content: 'first edit',
      revision: 1,
    });
    await host.request('editor:document:setContent', {
      reason: 'hostUpdate',
      fileUri: init.fileUri,
      content: 'external',
    });
    expect(changed).toHaveBeenCalledExactlyOnceWith({ content: 'first edit', revision: 1 });
    await expect(host.request('editor:document:getContent', null)).resolves.toEqual({
      content: 'external',
      revision: 2,
    });
  });

  it('ignores repeated init and stale save echoes without applying content again', async () => {
    await host.request('editor:document:setContent', init);
    edit('newer');
    await expect(host.request('editor:document:setContent', init)).resolves.toEqual({ applied: false, revision: 1 });
    await expect(
      host.request('editor:document:setContent', {
        reason: 'saveEcho',
        fileUri: init.fileUri,
        content: '',
        revision: 0,
      }),
    ).resolves.toEqual({ applied: false, revision: 1 });
    expect(apply).toHaveBeenCalledTimes(1);
    expect(content()).toBe('newer');
  });

  it('skips host content identical to the current document', async () => {
    await host.request('editor:document:setContent', init);
    edit('same');
    await expect(
      host.request('editor:document:setContent', { reason: 'hostUpdate', fileUri: init.fileUri, content: 'same' }),
    ).resolves.toEqual({ applied: false, revision: 1 });
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('applies authoritative updates even when their text matches an older edit', async () => {
    await host.request('editor:document:setContent', init);
    edit('A');
    edit('B');
    await expect(
      host.request('editor:document:setContent', { reason: 'hostUpdate', fileUri: init.fileUri, content: 'A' }),
    ).resolves.toEqual({ applied: true, revision: 3 });
    expect(content()).toBe('A');
  });

  it('answers validation and preview requests and runs the canvas history when the host does not own it', async () => {
    const localHistory = {
      undo: vi.fn(() => {
        edit('undo');
      }),
      redo: vi.fn(() => {
        edit('redo');
      }),
    };
    await host.request('editor:document:setContent', init);
    await expect(host.request('editor:undoRedo:apply', { command: 'undo' })).rejects.toMatchObject({
      code: 'NOT_READY',
    });
    binding.setLocalHistory(localHistory);
    await expect(host.request('editor:document:validate', null)).resolves.toEqual({ notifications: [] });
    await expect(host.request('editor:preview:get', null)).resolves.toEqual({ svg: null });
    await host.request('editor:undoRedo:apply', { command: 'undo' });
    await host.request('editor:undoRedo:apply', { command: 'redo' });
    expect(localHistory.undo).toHaveBeenCalledOnce();
    expect(localHistory.redo).toHaveBeenCalledOnce();
    await expect(host.request('editor:document:getContent', null)).resolves.toEqual({ content: 'redo', revision: 2 });
  });

  it('ignores edits and rejects history for a read-only document', async () => {
    const changed = vi.fn();
    host.on('editor:document:changed', changed);
    await host.request('editor:document:setContent', { ...init, readonly: true });
    edit('not allowed');
    await expect(host.request('editor:undoRedo:apply', { command: 'undo' })).rejects.toMatchObject({
      code: 'NOT_READY',
    });
    await expect(host.request('editor:document:getContent', null)).resolves.toEqual({
      content: 'not allowed',
      revision: 0,
    });
    expect(changed).not.toHaveBeenCalled();
  });

  it('keeps initialization disabled after a failed load and permits a deliberate retry', async () => {
    apply.mockImplementationOnce(() => {
      throw new BridgeError('IO_ERROR', 'read failed');
    });
    await expect(host.request('editor:document:setContent', init)).rejects.toMatchObject({ code: 'IO_ERROR' });
    expect(binding.getState().initialized).toBe(false);
    expect(binding.getState().error).toMatchObject({ message: 'read failed' });
    binding.dispose();
    binding = bindEditorDocument(editor);
    binding.adapter.subscribe(apply);
    await expect(host.request('editor:document:setContent', init)).resolves.toEqual({ applied: true, revision: 0 });
  });

  it('reports a startup error when the host never initializes a ready editor', async () => {
    vi.useFakeTimers();
    try {
      binding.ready();
      await vi.advanceTimersByTimeAsync(5_000);
      expect(binding.getState().error).toMatchObject({ code: 'TIMEOUT' });
      expect(binding.getState().initialized).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('suspends mutations on disconnect while retaining the content and revision', async () => {
    await host.request('editor:document:setContent', init);
    edit('unsaved');
    binding.suspend(new BridgeError('NOT_CONNECTED', 'Host disconnected'));
    await expect(host.request('editor:undoRedo:apply', { command: 'undo' })).rejects.toMatchObject({
      code: 'NOT_CONNECTED',
    });
    expect(content()).toBe('unsaved');
    expect(binding.getState().initialized).toBe(true);
  });

  it('stops delivering content after the provider unsubscribes', async () => {
    await host.request('editor:document:setContent', init);
    binding.adapter.subscribe(apply)();
    await expect(
      host.request('editor:document:setContent', { reason: 'hostUpdate', fileUri: init.fileUri, content: 'late' }),
    ).rejects.toMatchObject({ code: 'NOT_READY' });
    expect(content()).toBe('');
  });
});
