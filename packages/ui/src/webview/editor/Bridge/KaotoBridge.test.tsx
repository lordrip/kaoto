import { render } from '@testing-library/react';
import { ComponentProps } from 'react';

import { KaotoBridge } from './KaotoBridge';

describe('KaotoBridge', () => {
  const mockOnReady = vi.fn();
  const mockGetMetadata = vi.fn();
  const mockSetMetadata = vi.fn();
  const mockGetResourceContent = vi.fn();
  const mockIsResourceExist = vi.fn();
  const mockSaveResourceContent = vi.fn();
  const mockDeleteResource = vi.fn();
  const mockAskUserForFileSelection = vi.fn();
  const mockGetSuggestions = vi.fn();

  const defaultProps: ComponentProps<typeof KaotoBridge> = {
    onReady: mockOnReady,
    getMetadata: mockGetMetadata,
    setMetadata: mockSetMetadata,
    getResourceContent: mockGetResourceContent,
    isResourceExist: mockIsResourceExist,
    saveResourceContent: mockSaveResourceContent,
    deleteResource: mockDeleteResource,
    askUserForFileSelection: mockAskUserForFileSelection,
    getSuggestions: mockGetSuggestions,
    shouldSaveSchema: false,
    onStepUpdated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children components', () => {
    const { getByText } = render(
      <KaotoBridge {...defaultProps}>
        <div>Test Child</div>
      </KaotoBridge>,
    );
    expect(getByText('Test Child')).toBeInTheDocument();
  });

  it('registers the canvas history with the host binding and releases it on unmount', () => {
    const onHistory = vi.fn();
    const { unmount } = render(
      <KaotoBridge {...defaultProps} onHistory={onHistory}>
        <div>Test Child</div>
      </KaotoBridge>,
    );
    expect(onHistory).toHaveBeenCalledWith({ undo: expect.any(Function), redo: expect.any(Function) });
    unmount();
    expect(onHistory).toHaveBeenLastCalledWith(undefined);
  });

  it('should call onReady on mount', () => {
    render(
      <KaotoBridge {...defaultProps}>
        <div>Test Child</div>
      </KaotoBridge>,
    );
    expect(mockOnReady).toHaveBeenCalledTimes(1);
  });
});
