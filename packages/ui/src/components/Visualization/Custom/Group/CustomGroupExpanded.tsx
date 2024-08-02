import {
  CollapsibleGroupProps,
  GROUPS_LAYER,
  Layer,
  NodeShape,
  PointTuple,
  Rect,
  WithContextMenuProps,
  WithDndDropProps,
  WithDragNodeProps,
  WithSelectionProps,
  useSvgAnchor,
} from '@patternfly/react-topology';
import { observer } from 'mobx-react';
import { FunctionComponent, useRef } from 'react';
import { CustomGroupProps, PointWithSize } from './Group.models';

type CustomGroupExpandedProps = CustomGroupProps &
  CollapsibleGroupProps &
  WithDragNodeProps &
  WithSelectionProps &
  WithDndDropProps &
  WithContextMenuProps;

export const CustomGroupExpanded: FunctionComponent<CustomGroupExpandedProps> = observer(
  ({ className, element, onSelect, label, droppable, onContextMenu }) => {
    const vizNode = element.getData()?.vizNode;
    const anchorRef = useSvgAnchor();
    const boxRef = useRef<Rect | null>(null);

    if (!droppable || !boxRef.current) {
      const children = element.getNodes().filter((c) => c.isVisible());
      if (children.length === 0) {
        return null;
      }
      const points: (PointWithSize | PointTuple)[] = [];
      children.forEach((c) => {
        if (c.getNodeShape() === NodeShape.circle) {
          const bounds = c.getBounds();
          const { width, height } = bounds;
          const { x, y } = bounds.getCenter();
          const radius = Math.max(width, height) / 2;
          points.push([x, y, radius] as PointWithSize);
        } else {
          // add all 4 corners
          const { width, height, x, y } = c.getBounds();
          points.push([x, y, 0] as PointWithSize);
          points.push([x + width, y, 0] as PointWithSize);
          points.push([x, y + height, 0] as PointWithSize);
          points.push([x + width, y + height, 0] as PointWithSize);
        }
      });

      boxRef.current = element.getBounds();
    }

    return (
      <g onContextMenu={onContextMenu} onClick={onSelect} className={className}>
        <Layer id={GROUPS_LAYER}>
          <g onContextMenu={onContextMenu} onClick={onSelect} className={className}>
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
                  <span>{label || element.getLabel()}</span>
                </div>
              </div>
            </foreignObject>
          </g>
        </Layer>
      </g>
    );
  },
);
