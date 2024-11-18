import {
  Divider,
  DropdownItem,
  DropdownList,
  Icon,
  MenuToggle,
  MenuToggleAction,
  MenuToggleElement,
  Select,
} from '@patternfly/react-core';
import { ArrowDownIcon, ArrowUpIcon, CodeBranchIcon, PlusIcon } from '@patternfly/react-icons';
import clsx from 'clsx';
import { FunctionComponent, MouseEvent, Ref, useState } from 'react';
import { AddStepMode, IDataTestID, IVisualizationNode } from '../../../../models';
import { useAddStep } from '../../Custom/hooks/add-step.hook';
import { useInsertStep } from '../../Custom/hooks/insert-step.hook';
import './AddStepDropdown.scss';

interface IAddStepDropdown extends IDataTestID {
  className?: string;
  vizNode: IVisualizationNode;
}

export const AddStepDropdown: FunctionComponent<IAddStepDropdown> = ({
  className,
  vizNode,
  'data-testid': dataTestid,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { canHavePreviousStep, canHaveNextStep, canHaveChildren, canHaveSpecialChildren } =
    vizNode.getNodeInteraction();
  const { onAddStep } = useAddStep(vizNode, AddStepMode.AppendStep);
  const { onAddStep: onPrependStep } = useAddStep(vizNode, AddStepMode.PrependStep);
  const { onInsertStep } = useInsertStep(vizNode);
  const { onInsertStep: onInsertSpecial } = useInsertStep(vizNode, AddStepMode.InsertSpecialChildStep);

  const onToggleMenu = (event: MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    event.stopPropagation();
    setIsOpen(!isOpen);
  };

  const toggle = (toggleRef: Ref<MenuToggleElement>) => (
    <MenuToggle
      className={clsx(className, 'add-step-dropdown')}
      data-testid={dataTestid}
      ref={toggleRef}
      onClick={onToggleMenu}
      variant="primary"
      splitButtonOptions={{
        variant: 'action',
        items: [
          <MenuToggleAction
            id="add-step"
            key="add-step"
            data-testid="add-step"
            aria-label="add step"
            isDisabled={!canHaveNextStep}
            onClick={onAddStep}
          >
            <PlusIcon />
            <Icon size="sm">
              <ArrowDownIcon />
            </Icon>
          </MenuToggleAction>,
        ],
      }}
    />
  );

  return (
    <Select isOpen={isOpen} onOpenChange={setIsOpen} toggle={toggle}>
      <DropdownList>
        <DropdownItem
          key="step-toolbar-button-insert"
          data-testid="step-toolbar-button-insert"
          isDisabled={!canHaveChildren}
          onClick={onInsertStep}
        >
          <PlusIcon /> Insert step
        </DropdownItem>

        <DropdownItem
          key="step-toolbar-button-insert-special"
          data-testid="step-toolbar-button-insert-special"
          isDisabled={!canHaveSpecialChildren}
          onClick={onInsertSpecial}
        >
          <CodeBranchIcon /> Add branch
        </DropdownItem>

        <Divider key="divider" />

        <DropdownItem
          key="step-toolbar-button-prepend"
          data-testid="step-toolbar-button-prepend"
          isDisabled={!canHavePreviousStep}
          onClick={onPrependStep}
        >
          <PlusIcon />
          <Icon size="sm">
            <ArrowUpIcon />
          </Icon>
          Prepend
        </DropdownItem>

        <DropdownItem
          key="step-toolbar-button-append"
          data-testid="step-toolbar-button-append"
          isDisabled={!canHaveNextStep}
          onClick={onAddStep}
        >
          <PlusIcon />
          <Icon size="sm">
            <ArrowDownIcon />
          </Icon>
          Append
        </DropdownItem>
      </DropdownList>
    </Select>
  );
};
