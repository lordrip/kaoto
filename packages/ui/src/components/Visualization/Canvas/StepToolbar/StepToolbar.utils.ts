import { NodeInteraction } from '../../../../models';
import { CanvasDefaults } from '../canvas.defaults';

export interface StepToolbarOptions {
  nodeInteraction: NodeInteraction;
  /** Whether the collapse toggle button is shown */
  isCollapsible?: boolean;
  /** Whether the duplicate button is shown (from useDuplicateStep hook) */
  canDuplicate?: boolean;
  /** Whether the enable-all button is shown (from useEnableAllSteps hook) */
  areMultipleStepsDisabled?: boolean;
}

/**
 * Counts the number of visible toolbar buttons based on node interaction and options.
 */
export function getVisibleToolbarButtonCount(options: StepToolbarOptions): number {
  const { nodeInteraction, isCollapsible, canDuplicate, areMultipleStepsDisabled } = options;
  let count = 0;

  // Duplicate button
  if (canDuplicate) {
    count++;
  }

  // Add branch button (special children)
  if (nodeInteraction.canHaveSpecialChildren) {
    count++;
  }

  // Enable/Disable button
  if (nodeInteraction.canBeDisabled) {
    count++;
  }

  // Enable all button
  if (areMultipleStepsDisabled) {
    count++;
  }

  // Replace step button
  if (nodeInteraction.canReplaceStep) {
    count++;
  }

  // Collapse/Expand button
  if (isCollapsible) {
    count++;
  }

  // Delete step button
  if (nodeInteraction.canRemoveStep) {
    count++;
  }

  // Delete group button
  if (nodeInteraction.canRemoveFlow) {
    count++;
  }

  return count;
}

/**
 * Calculates the required toolbar width based on the number of buttons.
 * Formula: (buttonCount * buttonWidth) + ((buttonCount - 1) * margin) + (2 * padding)
 */
export function calculateToolbarWidth(buttonCount: number): number {
  if (buttonCount <= 0) {
    return 0;
  }

  const { STEP_TOOLBAR_BUTTON_WIDTH, STEP_TOOLBAR_BUTTON_MARGIN, STEP_TOOLBAR_PADDING } = CanvasDefaults;

  // Total width = buttons + margins between buttons + container padding on both sides
  const buttonsWidth = buttonCount * STEP_TOOLBAR_BUTTON_WIDTH;
  const marginsWidth = (buttonCount - 1) * STEP_TOOLBAR_BUTTON_MARGIN;
  const paddingWidth = 2 * STEP_TOOLBAR_PADDING;

  return buttonsWidth + marginsWidth + paddingWidth;
}

/**
 * Calculates the toolbar width ensuring it's at least as wide as the reference width (node/group).
 * This combines the dynamic button count calculation with a minimum width constraint.
 */
export function getToolbarWidth(options: StepToolbarOptions, referenceWidth: number): number {
  const buttonCount = getVisibleToolbarButtonCount(options);
  const calculatedWidth = calculateToolbarWidth(buttonCount);

  return Math.max(calculatedWidth, referenceWidth);
}
