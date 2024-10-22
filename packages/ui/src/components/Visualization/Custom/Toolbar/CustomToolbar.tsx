import { Icon } from '@patternfly/react-core';
import { BanIcon, CheckIcon, CodeBranchIcon, PlusIcon, SyncAltIcon, TrashIcon } from '@patternfly/react-icons';
import { FunctionComponent, PropsWithChildren } from 'react';
import { AddStepMode, IDataTestID, IVisualizationNode } from '../../../../models';
import { useDeleteStep } from '../hooks/delete-step.hook';
import { useDisableStep } from '../hooks/disable-step.hook';
import { useReplaceStep } from '../hooks/replace-step.hook';
import './CustomToolbar.scss';
import { useDeleteGroup } from '../hooks/delete-group.hook';
import { useInsertStep } from '../hooks/insert-step.hook';

interface ICustomNodeToolbar extends PropsWithChildren<IDataTestID> {
  className?: string;
  vizNode: IVisualizationNode;
}

export const CustomNodeToolbar: FunctionComponent<ICustomNodeToolbar> = ({
  className,
  vizNode,
  ['data-testid']: dataTestId,
}) => {
  const { canHaveChildren, canHaveSpecialChildren, canBeDisabled, canReplaceStep, canRemoveStep, canRemoveFlow } =
    vizNode.getNodeInteraction();
  const { onInsertStep } = useInsertStep(vizNode);
  const { onInsertStep: onInsertSpecial } = useInsertStep(vizNode, AddStepMode.InsertSpecialChildStep);
  const { onToggleDisableNode, isDisabled } = useDisableStep(vizNode);
  const { onReplaceNode } = useReplaceStep(vizNode);
  const { onDeleteStep } = useDeleteStep(vizNode);
  const { onDeleteGroup } = useDeleteGroup(vizNode);

  return (
    <div className={className}>
      {canHaveChildren && (
        <Icon
          size="md"
          className="custom-node__container__toolbar__button"
          key={`${dataTestId}__insert`}
          data-testid={`${dataTestId}__insert`}
          title="Add step"
          onClick={onInsertStep}
        >
          <PlusIcon />
        </Icon>
      )}

      {canHaveSpecialChildren && (
        <Icon
          size="md"
          className="custom-node__container__toolbar__button"
          key={`${dataTestId}__insert-special`}
          data-testid={`${dataTestId}__insert-special`}
          title="Add branch"
          onClick={onInsertSpecial}
        >
          <CodeBranchIcon />
        </Icon>
      )}

      {canBeDisabled && (
        <Icon
          size="md"
          className="custom-node__container__toolbar__button"
          key={`${dataTestId}__disable`}
          data-testid={`${dataTestId}__disable`}
          title={`${isDisabled ? 'Enable' : 'Disable'} step`}
          onClick={onToggleDisableNode}
        >
          {isDisabled ? <CheckIcon /> : <BanIcon />}
        </Icon>
      )}

      {canReplaceStep && (
        <Icon
          size="md"
          className="custom-node__container__toolbar__button"
          key={`${dataTestId}__replace`}
          data-testid={`${dataTestId}__replace`}
          title="Replace step"
          onClick={onReplaceNode}
        >
          <SyncAltIcon />
        </Icon>
      )}

      {canRemoveStep && (
        <Icon
          size="md"
          className="custom-node__container__toolbar__button danger"
          key={`${dataTestId}__delete-step`}
          data-testid={`${dataTestId}__delete-step`}
          title="Delete step"
          onClick={onDeleteStep}
        >
          <TrashIcon />
        </Icon>
      )}

      {canRemoveFlow && (
        <Icon
          size="md"
          className="custom-node__container__toolbar__button danger"
          key={`${dataTestId}__delete-group`}
          data-testid={`${dataTestId}__delete-group`}
          title="Delete group"
          onClick={onDeleteGroup}
        >
          <TrashIcon />
        </Icon>
      )}
    </div>
  );
};
