import { Button, Tooltip } from '@patternfly/react-core';
import { ExpandAltIcon, MinusIcon } from '@patternfly/react-icons';
import { CollapsibleGroupProps } from '@patternfly/react-topology';
import { FunctionComponent, MouseEventHandler } from 'react';
import { CustomGroupProps } from './Group.models';

interface CollapseButtonProps {
  element: CustomGroupProps['element'];
  onCollapseChange?: CollapsibleGroupProps['onCollapseChange'];
}

export const CollapseButton: FunctionComponent<CollapseButtonProps> = ({ element, onCollapseChange }) => {
  const id = element.getId();
  const onClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    onCollapseChange?.(element, !element.isCollapsed());
  };

  return (
    <Tooltip content={element.isCollapsed() ? 'Expand' : 'Collapse'}>
      <Button variant="control" onClick={onClick} data-testid={`collapseButton-${id}`}>
        {element.isCollapsed() ? <ExpandAltIcon /> : <MinusIcon />}
      </Button>
    </Tooltip>
  );
};