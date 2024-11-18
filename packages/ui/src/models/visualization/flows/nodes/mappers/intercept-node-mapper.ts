import { NodeIconResolver, NodeIconType } from '../../../../../utils/node-icon-resolver';
import { IVisualizationNode } from '../../../base-visual-entity';
import { createVisualizationNode } from '../../../visualization-node';
import { CamelRouteVisualEntityData, ICamelElementLookupResult } from '../../support/camel-component-types';
import { BaseNodeMapper } from './base-node-mapper';

export class InterceptNodeMapper extends BaseNodeMapper {
  getVizNodeFromProcessor(
    path: string,
    componentLookup: ICamelElementLookupResult,
    entityDefinition: unknown,
  ): IVisualizationNode {
    const data: CamelRouteVisualEntityData = {
      path,
      icon: NodeIconResolver.getIcon(componentLookup.processorName, NodeIconType.VisualEntity),
      processorName: componentLookup.processorName,
      isGroup: true,
    };

    const vizNode = createVisualizationNode(componentLookup.processorName, data);

    const children = this.getChildrenFromBranch(`${path}.steps`, entityDefinition);
    children.forEach((child) => {
      vizNode.addChild(child);
    });

    return vizNode;
  }
}
