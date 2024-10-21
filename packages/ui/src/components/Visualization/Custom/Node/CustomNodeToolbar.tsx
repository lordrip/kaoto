import { Icon } from '@patternfly/react-core';
import { BanIcon, CheckIcon, SyncAltIcon, TrashIcon } from '@patternfly/react-icons';
import { FunctionComponent, PropsWithChildren } from 'react';
import { IDataTestID, IVisualizationNode } from '../../../../models';
import { useDeleteStep } from '../hooks/delete-step.hook';
import { useDisableStep } from '../hooks/disable-step.hook';
import { useReplaceStep } from '../hooks/replace-step.hook';
import './CustomNodeToolbar.scss';

interface ICustomNodeToolbar extends PropsWithChildren<IDataTestID> {
  className?: string;
  vizNode: IVisualizationNode;
}

export const CustomNodeToolbar: FunctionComponent<ICustomNodeToolbar> = ({
  className,
  vizNode,
  ['data-testid']: dataTestId,
}) => {
  const { onToggleDisableNode, isDisabled } = useDisableStep(vizNode);
  const { onReplaceNode } = useReplaceStep(vizNode);
  const { onRemoveNode } = useDeleteStep(vizNode);

  return (
    <div className={className}>
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

      <Icon
        size="md"
        className="custom-node__container__toolbar__button danger"
        key={`${dataTestId}__remove`}
        data-testid={`${dataTestId}__remove`}
        title="Remove step"
        onClick={onRemoveNode}
      >
        <TrashIcon />
      </Icon>
    </div>
  );
};
