import {
  CollapsibleGroupProps,
  createSvgIdUrl,
  Ellipse,
  GROUPS_LAYER,
  LabelBadge,
  LabelPosition,
  Layer,
  NodeLabel,
  useCombineRefs,
  useDragNode,
  useHover,
  useSize,
  WithContextMenuProps,
  WithDndDropProps,
  WithDragNodeProps,
  WithSelectionProps,
} from '@patternfly/react-topology';
import { observer } from 'mobx-react';
import { FunctionComponent } from 'react';
import { CustomGroupProps } from './Group.models';
import { ExpandIcon } from '@patternfly/react-icons';
import { NODE_SHADOW_FILTER_ID_HOVER } from '@patternfly/react-topology/dist/esm/components/nodes/NodeShadows';

type CustomGroupCollapsedProps = CustomGroupProps &
  CollapsibleGroupProps &
  WithDragNodeProps &
  WithSelectionProps &
  WithDndDropProps &
  WithContextMenuProps;

export const CustomGroupCollapsed: FunctionComponent<CustomGroupCollapsedProps> = observer(
  ({
    className,
    element,
    collapsible,
    selected,
    onSelect,
    children,
    hover,
    label,
    secondaryLabel,
    showLabel = true,
    truncateLength,
    collapsedWidth,
    collapsedHeight,
    getCollapsedShape,
    onCollapseChange,
    collapsedShadowOffset = 8,
    dndDropRef,
    dragNodeRef,
    canDrop,
    dropTarget,
    onContextMenu,
    contextMenuOpen,
    dragging,
    labelPosition,
    badge,
    badgeColor,
    badgeTextColor,
    badgeBorderColor,
    badgeClassName,
    badgeLocation,
    labelIconClass,
    labelIcon,
    labelIconPadding,
  }) => {
    const [hovered, hoverRef] = useHover();
    const [labelHover, labelHoverRef] = useHover();
    const dragLabelRef = useDragNode()[1];
    const [shapeSize, shapeRef] = useSize([collapsedWidth, collapsedHeight]);
    const refs = useCombineRefs<SVGPathElement>(hoverRef, dragNodeRef, shapeRef);
    const isHover = hover !== undefined ? hover : hovered;
    const childCount = element.getAllNodeChildren().length;
    const [badgeSize, badgeRef] = useSize([childCount]);

    const ShapeComponent = getCollapsedShape ? getCollapsedShape(element) : Ellipse;
    const filter = isHover || dragging || dropTarget ? createSvgIdUrl(NODE_SHADOW_FILTER_ID_HOVER) : undefined;

    return (
      <g ref={labelHoverRef} onContextMenu={onContextMenu} onClick={onSelect}>
        <Layer id={GROUPS_LAYER}>
          <g ref={refs} onClick={onSelect}>
            {ShapeComponent && (
              <>
                <g transform={`translate(${collapsedShadowOffset * 2}, 0)`}>
                  <ShapeComponent element={element} width={collapsedWidth} height={collapsedHeight} />
                </g>
                <g transform={`translate(${collapsedShadowOffset}, 0)`}>
                  <ShapeComponent element={element} width={collapsedWidth} height={collapsedHeight} />
                </g>
                <ShapeComponent
                  key={isHover || dragging || dropTarget ? 'shape-background-hover' : 'shape-background'} // update key to force remount and filter update
                  element={element}
                  width={collapsedWidth}
                  height={collapsedHeight}
                  dndDropRef={dndDropRef}
                  filter={filter}
                />
              </>
            )}
          </g>
        </Layer>
        {shapeSize && childCount && (
          <LabelBadge
            ref={badgeRef}
            x={shapeSize.width - 8}
            y={(shapeSize.width - (badgeSize?.height ?? 0)) / 2}
            badge={`${childCount}`}
            badgeColor={badgeColor}
            badgeTextColor={badgeTextColor}
            badgeBorderColor={badgeBorderColor}
          />
        )}
        {showLabel && (
          <NodeLabel
            x={collapsedWidth / 2}
            y={labelPosition === LabelPosition.top ? collapsedHeight / 2 - collapsedHeight : collapsedHeight + 6}
            paddingX={8}
            paddingY={5}
            dragRef={dragNodeRef ? dragLabelRef : undefined}
            status={element.getNodeStatus()}
            secondaryLabel={secondaryLabel}
            truncateLength={truncateLength}
            badge={badge}
            badgeColor={badgeColor}
            badgeTextColor={badgeTextColor}
            badgeBorderColor={badgeBorderColor}
            badgeClassName={badgeClassName}
            badgeLocation={badgeLocation}
            labelIconClass={labelIconClass}
            labelIcon={labelIcon}
            labelIconPadding={labelIconPadding}
            onContextMenu={onContextMenu}
            contextMenuOpen={contextMenuOpen}
            hover={isHover || labelHover}
            actionIcon={collapsible ? <ExpandIcon /> : undefined}
            onActionIconClick={() => onCollapseChange(element, false)}
          >
            {label || element.getLabel()}
          </NodeLabel>
        )}
        {children}
      </g>
    );
  },
);
