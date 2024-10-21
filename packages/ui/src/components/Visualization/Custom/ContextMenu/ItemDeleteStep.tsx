import { TrashIcon } from '@patternfly/react-icons';
import { ContextMenuItem } from '@patternfly/react-topology';
import { FunctionComponent, PropsWithChildren } from 'react';
import { IDataTestID } from '../../../../models';
import { IVisualizationNode } from '../../../../models/visualization/base-visual-entity';
import { useDeleteStep } from '../hooks/delete-step.hook';

interface ItemDeleteStepProps extends PropsWithChildren<IDataTestID> {
  vizNode: IVisualizationNode;
  loadActionConfirmationModal: boolean;
}

export const ItemDeleteStep: FunctionComponent<ItemDeleteStepProps> = (props) => {
  const { onRemoveNode } = useDeleteStep(props.vizNode);
  return (
    <ContextMenuItem onClick={onRemoveNode} data-testid={props['data-testid']}>
      <TrashIcon /> Delete
    </ContextMenuItem>
  );
};
