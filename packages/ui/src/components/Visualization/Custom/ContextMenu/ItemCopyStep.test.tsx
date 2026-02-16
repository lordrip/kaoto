import { fireEvent, render } from '@testing-library/react';

import { CatalogKind, createVisualizationNode } from '../../../../models';
import { EntityType } from '../../../../models/camel/entities';
import { useCopyStep } from '../hooks/copy-step.hook';
import { ItemCopyStep } from './ItemCopyStep';

// Mock the `useCopyStep` hook
vi.mock('../hooks/copy-step.hook', () => ({
  useCopyStep: vi.fn(),
}));

describe('ItemCopyStep', () => {
  const vizNode = createVisualizationNode('test', { catalogKind: CatalogKind.Entity, name: EntityType.Route });
  const mockOnCopyStep = vi.fn();
  beforeEach(() => {
    // Mock the `useCopyStep` hook to return the `onCopyStep` function
    (useCopyStep as vi.Mock).mockReturnValue({
      onCopyStep: mockOnCopyStep,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render Copy ContextMenuItem', () => {
    const { container } = render(<ItemCopyStep vizNode={vizNode} />);

    expect(container).toMatchSnapshot();
  });

  it('should call onCopyStep when the context menu item is clicked', () => {
    const wrapper = render(<ItemCopyStep vizNode={vizNode} />);
    fireEvent.click(wrapper.getByText('Copy'));

    expect(mockOnCopyStep).toHaveBeenCalledTimes(1);
  });
});
