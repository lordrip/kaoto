import { AngleDoubleDownIcon, AngleDoubleUpIcon } from '@patternfly/react-icons';
import { fireEvent, render } from '@testing-library/react';

import { AddStepMode, CatalogKind, createVisualizationNode } from '../../../../models';
import { EntityType } from '../../../../models/camel/entities';
import { useMoveStep } from '../hooks/move-step.hook';
import { ItemMoveStep } from './ItemMoveStep';

// Mock the `useMoveStep` hook
vi.mock('../hooks/move-step.hook', () => ({
  useMoveStep: vi.fn(),
}));

describe('ItemMoveStep', () => {
  const vizNode = createVisualizationNode('test', { catalogKind: CatalogKind.Entity, name: EntityType.Route });
  const mockOnMoveStep = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render Move Next ContextMenuItem', () => {
    // Mock the `useMoveStep` hook to return compatible state
    (useMoveStep as vi.Mock).mockReturnValue({
      onMoveStep: mockOnMoveStep,
      canBeMoved: true,
    });

    const { container } = render(
      <ItemMoveStep vizNode={vizNode} mode={AddStepMode.AppendStep}>
        <AngleDoubleDownIcon /> Move Next
      </ItemMoveStep>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should not render Move Before ContextMenuItem', () => {
    // Mock the `useMoveStep` hook to return compatible state
    (useMoveStep as vi.Mock).mockReturnValue({
      onMoveStep: mockOnMoveStep,
      canBeMoved: false,
    });

    const { container } = render(
      <ItemMoveStep vizNode={vizNode} mode={AddStepMode.AppendStep}>
        <AngleDoubleUpIcon /> Move Before
      </ItemMoveStep>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should call onMoveStep when the context menu item is clicked', () => {
    // Mock the `useMoveStep` hook to return compatible state
    (useMoveStep as vi.Mock).mockReturnValue({
      onMoveStep: mockOnMoveStep,
      canBeMoved: true,
    });

    const wrapper = render(
      <ItemMoveStep vizNode={vizNode} mode={AddStepMode.AppendStep}>
        <AngleDoubleDownIcon /> Move Next
      </ItemMoveStep>,
    );
    fireEvent.click(wrapper.getByText('Move Next'));

    expect(mockOnMoveStep).toHaveBeenCalledTimes(1);
  });
});
