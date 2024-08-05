import {
  CollapsibleGroupProps,
  GROUPS_LAYER,
  Layer,
  Rect,
  WithContextMenuProps,
  WithDndDropProps,
  WithDragNodeProps,
  WithSelectionProps,
  observer,
  useSvgAnchor,
} from '@patternfly/react-topology';
import { FunctionComponent, useRef } from 'react';
import { CollapseButton } from './CollapseButton';
import { ContextMenuButton } from './ContextMenuButton';
import { CustomGroupProps } from './Group.models';

type CustomGroupExpandedProps = CustomGroupProps &
  CollapsibleGroupProps &
  WithDragNodeProps &
  WithSelectionProps &
  WithDndDropProps &
  WithContextMenuProps;

export const CustomGroupExpanded: FunctionComponent<CustomGroupExpandedProps> = observer(
  ({ className, element, onSelect, label: propsLabel, onContextMenu, onCollapseChange }) => {
    const label = propsLabel || element.getLabel();
    const boxRef = useRef<Rect>(element.getBounds());
    const vizNode = element.getData()?.vizNode;
    const anchorRef = useSvgAnchor();

    boxRef.current = element.getBounds();

    return (
      <g onContextMenu={onContextMenu} onClick={onSelect} className={className}>
        <Layer id={GROUPS_LAYER}>
          <g>
            <rect
              className="phantom-rect"
              ref={anchorRef}
              x={boxRef.current.x}
              y={boxRef.current.y}
              width={boxRef.current.width}
              height={boxRef.current.height}
            />
            <foreignObject
              className="foreign-object"
              x={boxRef.current.x}
              y={boxRef.current.y}
              width={boxRef.current.width}
              height={boxRef.current.height}
            >
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
      </g>
    );
  },
);
