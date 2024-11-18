import { NodeIconResolver, NodeIconType } from '../../../../../utils/node-icon-resolver';
import { IVisualizationNode } from '../../../base-visual-entity';
import { createVisualizationNode } from '../../../visualization-node';
import { CamelRouteVisualEntityData, ICamelElementLookupResult } from '../../support/camel-component-types';
import { BaseNodeMapper } from './base-node-mapper';

export class RouteNodeMapper extends BaseNodeMapper {
  getVizNodeFromProcessor(
    path: string,
    componentLookup: ICamelElementLookupResult,
    entityDefinition: unknown,
  ): IVisualizationNode {
    const data: CamelRouteVisualEntityData = {
      path,
      isGroup: true,
      icon: NodeIconResolver.getIcon(componentLookup.processorName, NodeIconType.VisualEntity),
      processorName: componentLookup.processorName,
    };

    const vizNode = createVisualizationNode(componentLookup.processorName, data);
    const [fromNode] = this.getChildrenFromSingleClause(`${path}.from`, entityDefinition);

    let nextNode = fromNode;
    while (nextNode) {
      vizNode.addChild(nextNode);
      nextNode = nextNode.getNextNode()!;
    }

    return vizNode;
  }
}
