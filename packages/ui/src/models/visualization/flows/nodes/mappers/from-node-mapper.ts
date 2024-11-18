import { ProcessorDefinition } from '@kaoto/camel-catalog/types';
import { getValue } from '../../../../../utils';
import { NodeIconResolver, NodeIconType } from '../../../../../utils/node-icon-resolver';
import { IVisualizationNode } from '../../../base-visual-entity';
import { createVisualizationNode } from '../../../visualization-node';
import { CamelComponentSchemaService } from '../../support/camel-component-schema.service';
import { CamelRouteVisualEntityData, ICamelElementLookupResult } from '../../support/camel-component-types';
import { BaseNodeMapper } from './base-node-mapper';

export class FromNodeMapper extends BaseNodeMapper {
  getVizNodeFromProcessor(
    path: string,
    _componentLookup: ICamelElementLookupResult,
    entityDefinition: unknown,
  ): IVisualizationNode {
    const uriString = getValue(entityDefinition, `${path}.uri`);
    const processorName = 'from' as keyof ProcessorDefinition;
    const componentName = CamelComponentSchemaService.getComponentNameFromUri(uriString);

    const nodeIconType = componentName ? NodeIconType.Component : NodeIconType.EIP;
    const data: CamelRouteVisualEntityData = {
      path,
      icon: NodeIconResolver.getIcon(
        CamelComponentSchemaService.getIconName({
          processorName,
          componentName,
        }),
        nodeIconType,
      ),
      processorName,
      componentName,
      isGroup: false,
    };

    const vizNode = createVisualizationNode(componentName ?? processorName, data);

    const children = this.getChildrenFromBranch(`${path}.steps`, entityDefinition);
    children.forEach((child, index) => {
      if (index === 0) {
        vizNode.setNextNode(child);
        child.setPreviousNode(vizNode);
      }

      const previousChild = vizNode.getChildren()?.[index - 1];
      if (previousChild) {
        previousChild.setNextNode(child);
        child.setPreviousNode(previousChild);
      }
    });

    return vizNode;
  }
}
