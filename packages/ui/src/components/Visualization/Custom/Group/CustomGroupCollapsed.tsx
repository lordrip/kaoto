import {
  CollapsibleGroupProps,
  GROUPS_LAYER,
  Layer,
  WithContextMenuProps,
  WithDndDropProps,
  WithDragNodeProps,
  WithSelectionProps,
  observer,
  useSvgAnchor,
} from '@patternfly/react-topology';
import { FunctionComponent } from 'react';
import { CollapseButton } from './CollapseButton';
import { ContextMenuButton } from './ContextMenuButton';
import { CustomGroupProps } from './Group.models';

type CustomGroupExpandedProps = CustomGroupProps &
  CollapsibleGroupProps &
  WithDragNodeProps &
  WithSelectionProps &
  WithDndDropProps &
  WithContextMenuProps;

export const CustomGroupCollapsed: FunctionComponent<CustomGroupExpandedProps> = observer(
  ({
    className,
    children,
    collapsedWidth,
    collapsedHeight,
    element,
    onSelect,
    label: propsLabel,
    onContextMenu,
    onCollapseChange,
  }) => {
    const label = propsLabel || element.getLabel();
    const vizNode = element.getData()?.vizNode;
    const anchorRef = useSvgAnchor();

    return (
      <g onContextMenu={onContextMenu} onClick={onSelect} className={className}>
        <Layer id={GROUPS_LAYER}>
          <g>
            <rect className="phantom-rect" ref={anchorRef} width={collapsedWidth} height={collapsedHeight} />

            <foreignObject className="foreign-object" width={collapsedWidth} height={collapsedHeight}>
              <div className={className}>
                <div className="custom-group__title">
                  <div className="custom-group__title__img-circle">
                    <img src={vizNode?.data.icon} />
                  </div>
                  <span title={label}>{label}</span>

                  <CollapseButton element={element} onCollapseChange={onCollapseChange} />
                  <ContextMenuButton element={element} />
                </div>
              </div>
            </foreignObject>
          </g>
        </Layer>
        {children}
      </g>
    );
  },
);
