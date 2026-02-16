import { act, renderHook } from '@testing-library/react';
import hotkeys from 'hotkeys-js';

import { IVisualizationNode } from '../../../../models';
import { useDeleteGroup } from './delete-group.hook';
import useDeleteHotkey from './delete-hotkey.hook';
import { useDeleteStep } from './delete-step.hook';

// Mock hotkeys-js
vi.mock('hotkeys-js', () => {
  const mockHotkeys = vi.fn();
  const mockUnbind = vi.fn();
  Object.assign(mockHotkeys, { unbind: mockUnbind });
  return { default: mockHotkeys };
});

const mockHotkeys = hotkeys as vi.MockedFunction<typeof hotkeys>;

vi.mock('./delete-step.hook', () => ({
  useDeleteStep: vi.fn(),
}));

vi.mock('./delete-group.hook', () => ({
  useDeleteGroup: vi.fn(),
}));

// Helper to create fake node
function makeNode({ canRemoveStep = false, canRemoveFlow = false } = {}) {
  return {
    getNodeInteraction: () => ({ canRemoveStep, canRemoveFlow }),
  } as unknown as IVisualizationNode;
}

describe('useDeleteHotkey', () => {
  let clearSelected: vi.Mock;
  let onDeleteStep: vi.Mock;
  let onDeleteGroup: vi.Mock;

  beforeEach(() => {
    clearSelected = vi.fn();
    onDeleteStep = vi.fn();
    onDeleteGroup = vi.fn();

    (useDeleteStep as vi.Mock).mockReturnValue({ onDeleteStep });
    (useDeleteGroup as vi.Mock).mockReturnValue({ onDeleteGroup });

    vi.clearAllMocks();
  });

  // Small helper for tests
  function setupHotkey(node?: IVisualizationNode) {
    let capturedHandler;
    mockHotkeys.mockImplementation((_keys, handler) => {
      capturedHandler = handler;
    });

    renderHook(() => useDeleteHotkey(node, clearSelected));
    return capturedHandler!;
  }

  it('should bind and unbind hotkeys on mount/unmount', () => {
    const { unmount } = renderHook(() => useDeleteHotkey(undefined, clearSelected));

    expect(mockHotkeys).toHaveBeenCalledWith('Delete, backspace', expect.any(Function));

    unmount();
    expect(mockHotkeys.unbind).toHaveBeenCalledWith('Delete, backspace');
  });

  it('should do nothing if no node selected', () => {
    const handler = setupHotkey(undefined);

    const preventDefault = vi.fn();
    act(() => handler({ preventDefault }));

    expect(onDeleteStep).not.toHaveBeenCalled();
    expect(onDeleteGroup).not.toHaveBeenCalled();
    expect(clearSelected).not.toHaveBeenCalled();
  });

  it('should call onDeleteStep and clearSelected when canRemoveStep=true', () => {
    const handler = setupHotkey(makeNode({ canRemoveStep: true }));

    const preventDefault = vi.fn();
    act(() => handler({ preventDefault }));

    expect(onDeleteStep).toHaveBeenCalled();
    expect(onDeleteGroup).not.toHaveBeenCalled();
    expect(clearSelected).toHaveBeenCalled();
  });

  it('should call onDeleteGroup and clearSelected when canRemoveFlow=true', () => {
    const handler = setupHotkey(makeNode({ canRemoveFlow: true }));

    const preventDefault = vi.fn();
    act(() => handler({ preventDefault }));

    expect(onDeleteStep).not.toHaveBeenCalled();
    expect(onDeleteGroup).toHaveBeenCalled();
    expect(clearSelected).toHaveBeenCalled();
  });

  it('should do nothing when node cannot be removed', () => {
    const handler = setupHotkey(makeNode({ canRemoveStep: false, canRemoveFlow: false }));

    const preventDefault = vi.fn();
    act(() => handler({ preventDefault }));

    expect(onDeleteStep).not.toHaveBeenCalled();
    expect(onDeleteGroup).not.toHaveBeenCalled();
    expect(clearSelected).not.toHaveBeenCalled();
  });

  it('should call preventDefault on event', () => {
    const handler = setupHotkey(makeNode({ canRemoveStep: true }));

    const preventDefault = vi.fn();
    act(() => handler({ preventDefault }));

    expect(preventDefault).toHaveBeenCalled();
  });
});
