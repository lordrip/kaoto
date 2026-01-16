import { fireEvent, render, screen } from '@testing-library/react';

import { IVisualizationNode, NodeInteraction } from '../../../../models';
import { StepToolbar } from './StepToolbar';

// Mock the hooks
jest.mock('../../Custom/hooks/delete-group.hook', () => ({
  useDeleteGroup: jest.fn(),
}));
jest.mock('../../Custom/hooks/delete-step.hook', () => ({
  useDeleteStep: jest.fn(),
}));
jest.mock('../../Custom/hooks/disable-step.hook', () => ({
  useDisableStep: jest.fn(),
}));
jest.mock('../../Custom/hooks/duplicate-step.hook', () => ({
  useDuplicateStep: jest.fn(),
}));
jest.mock('../../Custom/hooks/enable-all-steps.hook', () => ({
  useEnableAllSteps: jest.fn(),
}));
jest.mock('../../Custom/hooks/insert-step.hook', () => ({
  useInsertStep: jest.fn(),
}));
jest.mock('../../Custom/hooks/replace-step.hook', () => ({
  useReplaceStep: jest.fn(),
}));

import { useDeleteGroup } from '../../Custom/hooks/delete-group.hook';
import { useDeleteStep } from '../../Custom/hooks/delete-step.hook';
import { useDisableStep } from '../../Custom/hooks/disable-step.hook';
import { useDuplicateStep } from '../../Custom/hooks/duplicate-step.hook';
import { useEnableAllSteps } from '../../Custom/hooks/enable-all-steps.hook';
import { useInsertStep } from '../../Custom/hooks/insert-step.hook';
import { useReplaceStep } from '../../Custom/hooks/replace-step.hook';

describe('StepToolbar', () => {
  const mockOnDeleteGroup = jest.fn();
  const mockOnDeleteStep = jest.fn();
  const mockOnToggleDisableNode = jest.fn();
  const mockOnDuplicate = jest.fn();
  const mockOnEnableAllSteps = jest.fn();
  const mockOnInsertStep = jest.fn();
  const mockOnReplaceNode = jest.fn();

  const defaultNodeInteraction: NodeInteraction = {
    canHavePreviousStep: false,
    canHaveNextStep: false,
    canHaveChildren: false,
    canHaveSpecialChildren: false,
    canReplaceStep: false,
    canRemoveStep: false,
    canRemoveFlow: false,
    canBeDisabled: false,
  };

  const createMockVizNode = (nodeInteraction: Partial<NodeInteraction> = {}): IVisualizationNode => {
    return {
      getNodeInteraction: jest.fn().mockReturnValue({
        ...defaultNodeInteraction,
        ...nodeInteraction,
      }),
    } as unknown as IVisualizationNode;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useDeleteGroup as jest.Mock).mockReturnValue({ onDeleteGroup: mockOnDeleteGroup });
    (useDeleteStep as jest.Mock).mockReturnValue({ onDeleteStep: mockOnDeleteStep });
    (useDisableStep as jest.Mock).mockReturnValue({ onToggleDisableNode: mockOnToggleDisableNode, isDisabled: false });
    (useDuplicateStep as jest.Mock).mockReturnValue({ canDuplicate: false, onDuplicate: mockOnDuplicate });
    (useEnableAllSteps as jest.Mock).mockReturnValue({
      areMultipleStepsDisabled: false,
      onEnableAllSteps: mockOnEnableAllSteps,
    });
    (useInsertStep as jest.Mock).mockReturnValue({ onInsertStep: mockOnInsertStep });
    (useReplaceStep as jest.Mock).mockReturnValue({ onReplaceNode: mockOnReplaceNode });
  });

  it('should render the toolbar container', () => {
    const vizNode = createMockVizNode();
    render(<StepToolbar vizNode={vizNode} data-testid="step-toolbar" />);

    expect(screen.getByTestId('step-toolbar')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const vizNode = createMockVizNode();
    render(<StepToolbar vizNode={vizNode} className="custom-class" data-testid="step-toolbar" />);

    expect(screen.getByTestId('step-toolbar')).toHaveClass('custom-class');
    expect(screen.getByTestId('step-toolbar')).toHaveClass('step-toolbar');
  });

  describe('Duplicate button', () => {
    it('should render duplicate button when canDuplicate is true', () => {
      const vizNode = createMockVizNode();
      (useDuplicateStep as jest.Mock).mockReturnValue({ canDuplicate: true, onDuplicate: mockOnDuplicate });

      render(<StepToolbar vizNode={vizNode} />);

      expect(screen.getByTestId('step-toolbar-button-duplicate')).toBeInTheDocument();
    });

    it('should not render duplicate button when canDuplicate is false', () => {
      const vizNode = createMockVizNode();
      (useDuplicateStep as jest.Mock).mockReturnValue({ canDuplicate: false, onDuplicate: mockOnDuplicate });

      render(<StepToolbar vizNode={vizNode} />);

      expect(screen.queryByTestId('step-toolbar-button-duplicate')).not.toBeInTheDocument();
    });

    it('should call onDuplicate and stopPropagation when clicked', () => {
      const vizNode = createMockVizNode();
      (useDuplicateStep as jest.Mock).mockReturnValue({ canDuplicate: true, onDuplicate: mockOnDuplicate });

      render(<StepToolbar vizNode={vizNode} />);

      const button = screen.getByTestId('step-toolbar-button-duplicate');
      const event = { stopPropagation: jest.fn() };
      fireEvent.click(button, event);

      expect(mockOnDuplicate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Add branch button', () => {
    it('should render add branch button when canHaveSpecialChildren is true', () => {
      const vizNode = createMockVizNode({ canHaveSpecialChildren: true });

      render(<StepToolbar vizNode={vizNode} />);

      expect(screen.getByTestId('step-toolbar-button-add-special')).toBeInTheDocument();
    });

    it('should not render add branch button when canHaveSpecialChildren is false', () => {
      const vizNode = createMockVizNode({ canHaveSpecialChildren: false });

      render(<StepToolbar vizNode={vizNode} />);

      expect(screen.queryByTestId('step-toolbar-button-add-special')).not.toBeInTheDocument();
    });

    it('should call onInsertStep and stopPropagation when clicked', () => {
      const vizNode = createMockVizNode({ canHaveSpecialChildren: true });

      render(<StepToolbar vizNode={vizNode} />);

      const button = screen.getByTestId('step-toolbar-button-add-special');
      fireEvent.click(button);

      expect(mockOnInsertStep).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disable button', () => {
    it('should render disable button when canBeDisabled is true', () => {
      const vizNode = createMockVizNode({ canBeDisabled: true });

      render(<StepToolbar vizNode={vizNode} />);

      expect(screen.getByTestId('step-toolbar-button-disable')).toBeInTheDocument();
    });

    it('should not render disable button when canBeDisabled is false', () => {
      const vizNode = createMockVizNode({ canBeDisabled: false });

      render(<StepToolbar vizNode={vizNode} />);

      expect(screen.queryByTestId('step-toolbar-button-disable')).not.toBeInTheDocument();
    });

    it('should show "Disable step" title when step is not disabled', () => {
      const vizNode = createMockVizNode({ canBeDisabled: true });
      (useDisableStep as jest.Mock).mockReturnValue({ onToggleDisableNode: mockOnToggleDisableNode, isDisabled: false });

      render(<StepToolbar vizNode={vizNode} />);

      const button = screen.getByTestId('step-toolbar-button-disable');
      expect(button).toHaveAttribute('title', 'Disable step');
    });

    it('should show "Enable step" title when step is disabled', () => {
      const vizNode = createMockVizNode({ canBeDisabled: true });
      (useDisableStep as jest.Mock).mockReturnValue({ onToggleDisableNode: mockOnToggleDisableNode, isDisabled: true });

      render(<StepToolbar vizNode={vizNode} />);

      const button = screen.getByTestId('step-toolbar-button-disable');
      expect(button).toHaveAttribute('title', 'Enable step');
    });

    it('should call onToggleDisableNode when clicked', () => {
      const vizNode = createMockVizNode({ canBeDisabled: true });

      render(<StepToolbar vizNode={vizNode} />);

      const button = screen.getByTestId('step-toolbar-button-disable');
      fireEvent.click(button);

      expect(mockOnToggleDisableNode).toHaveBeenCalledTimes(1);
    });
  });

  describe('Enable all button', () => {
    it('should render enable all button when areMultipleStepsDisabled is true', () => {
      const vizNode = createMockVizNode();
      (useEnableAllSteps as jest.Mock).mockReturnValue({
        areMultipleStepsDisabled: true,
        onEnableAllSteps: mockOnEnableAllSteps,
      });

      render(<StepToolbar vizNode={vizNode} />);

      expect(screen.getByTestId('step-toolbar-button-enable-all')).toBeInTheDocument();
    });

    it('should not render enable all button when areMultipleStepsDisabled is false', () => {
      const vizNode = createMockVizNode();
      (useEnableAllSteps as jest.Mock).mockReturnValue({
        areMultipleStepsDisabled: false,
        onEnableAllSteps: mockOnEnableAllSteps,
      });

      render(<StepToolbar vizNode={vizNode} />);

      expect(screen.queryByTestId('step-toolbar-button-enable-all')).not.toBeInTheDocument();
    });

    it('should call onEnableAllSteps when clicked', () => {
      const vizNode = createMockVizNode();
      (useEnableAllSteps as jest.Mock).mockReturnValue({
        areMultipleStepsDisabled: true,
        onEnableAllSteps: mockOnEnableAllSteps,
      });

      render(<StepToolbar vizNode={vizNode} />);

      const button = screen.getByTestId('step-toolbar-button-enable-all');
      fireEvent.click(button);

      expect(mockOnEnableAllSteps).toHaveBeenCalledTimes(1);
    });
  });

  describe('Replace button', () => {
    it('should render replace button when canReplaceStep is true', () => {
      const vizNode = createMockVizNode({ canReplaceStep: true });

      render(<StepToolbar vizNode={vizNode} />);

      expect(screen.getByTestId('step-toolbar-button-replace')).toBeInTheDocument();
    });

    it('should not render replace button when canReplaceStep is false', () => {
      const vizNode = createMockVizNode({ canReplaceStep: false });

      render(<StepToolbar vizNode={vizNode} />);

      expect(screen.queryByTestId('step-toolbar-button-replace')).not.toBeInTheDocument();
    });

    it('should call onReplaceNode when clicked', () => {
      const vizNode = createMockVizNode({ canReplaceStep: true });

      render(<StepToolbar vizNode={vizNode} />);

      const button = screen.getByTestId('step-toolbar-button-replace');
      fireEvent.click(button);

      expect(mockOnReplaceNode).toHaveBeenCalledTimes(1);
    });
  });

  describe('Collapse button', () => {
    it('should render collapse button when onCollapseToggle is provided', () => {
      const vizNode = createMockVizNode();
      const mockOnCollapseToggle = jest.fn();

      render(<StepToolbar vizNode={vizNode} onCollapseToggle={mockOnCollapseToggle} />);

      expect(screen.getByTestId('step-toolbar-button-collapse')).toBeInTheDocument();
    });

    it('should not render collapse button when onCollapseToggle is not provided', () => {
      const vizNode = createMockVizNode();

      render(<StepToolbar vizNode={vizNode} />);

      expect(screen.queryByTestId('step-toolbar-button-collapse')).not.toBeInTheDocument();
    });

    it('should show "Collapse step" title when step is not collapsed', () => {
      const vizNode = createMockVizNode();
      const mockOnCollapseToggle = jest.fn();

      render(<StepToolbar vizNode={vizNode} onCollapseToggle={mockOnCollapseToggle} isCollapsed={false} />);

      const button = screen.getByTestId('step-toolbar-button-collapse');
      expect(button).toHaveAttribute('title', 'Collapse step');
    });

    it('should show "Expand step" title when step is collapsed', () => {
      const vizNode = createMockVizNode();
      const mockOnCollapseToggle = jest.fn();

      render(<StepToolbar vizNode={vizNode} onCollapseToggle={mockOnCollapseToggle} isCollapsed={true} />);

      const button = screen.getByTestId('step-toolbar-button-collapse');
      expect(button).toHaveAttribute('title', 'Expand step');
    });

    it('should call onCollapseToggle when clicked', () => {
      const vizNode = createMockVizNode();
      const mockOnCollapseToggle = jest.fn();

      render(<StepToolbar vizNode={vizNode} onCollapseToggle={mockOnCollapseToggle} />);

      const button = screen.getByTestId('step-toolbar-button-collapse');
      fireEvent.click(button);

      expect(mockOnCollapseToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Delete step button', () => {
    it('should render delete step button when canRemoveStep is true', () => {
      const vizNode = createMockVizNode({ canRemoveStep: true });

      render(<StepToolbar vizNode={vizNode} />);

      expect(screen.getByTestId('step-toolbar-button-delete')).toBeInTheDocument();
    });

    it('should not render delete step button when canRemoveStep is false', () => {
      const vizNode = createMockVizNode({ canRemoveStep: false });

      render(<StepToolbar vizNode={vizNode} />);

      expect(screen.queryByTestId('step-toolbar-button-delete')).not.toBeInTheDocument();
    });

    it('should call onDeleteStep when clicked', () => {
      const vizNode = createMockVizNode({ canRemoveStep: true });

      render(<StepToolbar vizNode={vizNode} />);

      const button = screen.getByTestId('step-toolbar-button-delete');
      fireEvent.click(button);

      expect(mockOnDeleteStep).toHaveBeenCalledTimes(1);
    });
  });

  describe('Delete group button', () => {
    it('should render delete group button when canRemoveFlow is true', () => {
      const vizNode = createMockVizNode({ canRemoveFlow: true });

      render(<StepToolbar vizNode={vizNode} />);

      expect(screen.getByTestId('step-toolbar-button-delete-group')).toBeInTheDocument();
    });

    it('should not render delete group button when canRemoveFlow is false', () => {
      const vizNode = createMockVizNode({ canRemoveFlow: false });

      render(<StepToolbar vizNode={vizNode} />);

      expect(screen.queryByTestId('step-toolbar-button-delete-group')).not.toBeInTheDocument();
    });

    it('should call onDeleteGroup when clicked', () => {
      const vizNode = createMockVizNode({ canRemoveFlow: true });

      render(<StepToolbar vizNode={vizNode} />);

      const button = screen.getByTestId('step-toolbar-button-delete-group');
      fireEvent.click(button);

      expect(mockOnDeleteGroup).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multiple buttons visible', () => {
    it('should render all buttons when all conditions are met', () => {
      const vizNode = createMockVizNode({
        canHaveSpecialChildren: true,
        canBeDisabled: true,
        canReplaceStep: true,
        canRemoveStep: true,
        canRemoveFlow: true,
      });
      const mockOnCollapseToggle = jest.fn();

      (useDuplicateStep as jest.Mock).mockReturnValue({ canDuplicate: true, onDuplicate: mockOnDuplicate });
      (useEnableAllSteps as jest.Mock).mockReturnValue({
        areMultipleStepsDisabled: true,
        onEnableAllSteps: mockOnEnableAllSteps,
      });

      render(<StepToolbar vizNode={vizNode} onCollapseToggle={mockOnCollapseToggle} />);

      expect(screen.getByTestId('step-toolbar-button-duplicate')).toBeInTheDocument();
      expect(screen.getByTestId('step-toolbar-button-add-special')).toBeInTheDocument();
      expect(screen.getByTestId('step-toolbar-button-disable')).toBeInTheDocument();
      expect(screen.getByTestId('step-toolbar-button-enable-all')).toBeInTheDocument();
      expect(screen.getByTestId('step-toolbar-button-replace')).toBeInTheDocument();
      expect(screen.getByTestId('step-toolbar-button-collapse')).toBeInTheDocument();
      expect(screen.getByTestId('step-toolbar-button-delete')).toBeInTheDocument();
      expect(screen.getByTestId('step-toolbar-button-delete-group')).toBeInTheDocument();
    });

    it('should render no optional buttons when all conditions are false', () => {
      const vizNode = createMockVizNode();

      render(<StepToolbar vizNode={vizNode} />);

      expect(screen.queryByTestId('step-toolbar-button-duplicate')).not.toBeInTheDocument();
      expect(screen.queryByTestId('step-toolbar-button-add-special')).not.toBeInTheDocument();
      expect(screen.queryByTestId('step-toolbar-button-disable')).not.toBeInTheDocument();
      expect(screen.queryByTestId('step-toolbar-button-enable-all')).not.toBeInTheDocument();
      expect(screen.queryByTestId('step-toolbar-button-replace')).not.toBeInTheDocument();
      expect(screen.queryByTestId('step-toolbar-button-collapse')).not.toBeInTheDocument();
      expect(screen.queryByTestId('step-toolbar-button-delete')).not.toBeInTheDocument();
      expect(screen.queryByTestId('step-toolbar-button-delete-group')).not.toBeInTheDocument();
    });
  });
});
