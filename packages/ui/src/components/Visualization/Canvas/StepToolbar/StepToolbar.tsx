import { Button } from '@patternfly/react-core';
import { BanIcon, CheckIcon, CodeBranchIcon, PlusIcon, SyncAltIcon, TrashIcon } from '@patternfly/react-icons';
import clsx from 'clsx';
import { FunctionComponent } from 'react';
import { AddStepMode, IDataTestID, IVisualizationNode } from '../../../../models';
import { useDeleteGroup } from '../../Custom/hooks/delete-group.hook';
import { useDeleteStep } from '../../Custom/hooks/delete-step.hook';
import { useDisableStep } from '../../Custom/hooks/disable-step.hook';
import { useInsertStep } from '../../Custom/hooks/insert-step.hook';
import { useReplaceStep } from '../../Custom/hooks/replace-step.hook';
import './StepToolbar.scss';

interface IStepToolbar extends IDataTestID {
  className?: string;
  vizNode: IVisualizationNode;
}

export const StepToolbar: FunctionComponent<IStepToolbar> = ({ vizNode, className, 'data-testid': dataTestId }) => {
  const { canHaveChildren, canHaveSpecialChildren, canBeDisabled, canReplaceStep, canRemoveStep, canRemoveFlow } =
    vizNode.getNodeInteraction();
  const { onInsertStep } = useInsertStep(vizNode);
  const { onInsertStep: onInsertSpecial } = useInsertStep(vizNode, AddStepMode.InsertSpecialChildStep);
  const { onToggleDisableNode, isDisabled } = useDisableStep(vizNode);
  const { onReplaceNode } = useReplaceStep(vizNode);
  const { onDeleteStep } = useDeleteStep(vizNode);
  const { onDeleteGroup } = useDeleteGroup(vizNode);

  return (
    <div className={clsx(className, 'step-toolbar')} data-test-id={dataTestId}>
      {canHaveChildren && (
        <Button className="step-toolbar__button" variant="secondary" onClick={onInsertStep}>
          <PlusIcon /> Add step
        </Button>
      )}

      {canHaveSpecialChildren && (
        <Button className="step-toolbar__button" variant="secondary" onClick={onInsertSpecial}>
          <CodeBranchIcon /> Add branch
        </Button>
      )}

      {canBeDisabled && (
        <Button className="step-toolbar__button" variant="secondary" onClick={onToggleDisableNode}>
          {isDisabled ? (
            <>
              <CheckIcon /> Enable
            </>
          ) : (
            <>
              <BanIcon /> Disable
            </>
          )}
        </Button>
      )}

      {canReplaceStep && (
        <Button className="step-toolbar__button" variant="secondary" onClick={onReplaceNode}>
          <SyncAltIcon /> Replace step
        </Button>
      )}

      {canRemoveStep && (
        <Button className="step-toolbar__button" variant="danger" onClick={onDeleteStep}>
          <TrashIcon /> Delete step
        </Button>
      )}

      {canRemoveFlow && (
        <Button className="step-toolbar__button" variant="danger" onClick={onDeleteGroup}>
          <TrashIcon /> Delete group
        </Button>
      )}
    </div>
  );
};
