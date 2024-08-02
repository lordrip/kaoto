import { Dimensions, isNode, Node } from '@patternfly/react-topology';
import clsx from 'clsx';
import { observer } from 'mobx-react';
import { FunctionComponent } from 'react';
import CustomGroupCollapsed from './CustomGroupCollapsed';
import { CustomGroupExpanded } from './CustomGroupExpanded';
import { CustomGroupProps } from './Group.models';

const CustomGroupCollapsibleInner: FunctionComponent<CustomGroupProps> = observer(
  ({ className, element, selected, onCollapseChange, ...rest }) => {
    const handleCollapse = (group: Node, collapsed: boolean): void => {
      if (collapsed && rest.collapsedWidth !== undefined && rest.collapsedHeight !== undefined) {
        group.setDimensions(new Dimensions(rest.collapsedWidth, rest.collapsedHeight));
      }
      group.setCollapsed(collapsed);
      onCollapseChange && onCollapseChange(group, collapsed);
    };

    const classNames = clsx(className, { 'custom-group--selected': selected });

    if (element.isCollapsed()) {
      return (
        <CustomGroupCollapsed className={classNames} element={element} onCollapseChange={handleCollapse} {...rest} />
      );
    }
    return <CustomGroupExpanded className={classNames} element={element} onCollapseChange={handleCollapse} {...rest} />;
  },
);

export const CustomGroupCollapsible: FunctionComponent<CustomGroupProps> = ({ element, ...rest }) => {
  if (!isNode(element)) {
    throw new Error('DefaultGroup must be used only on Node elements');
  }

  return <CustomGroupCollapsibleInner element={element} {...rest} />;
};
