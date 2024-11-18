import { FromDefinition, ProcessorDefinition } from '@kaoto/camel-catalog/types';
import { camelRouteJson } from '../../../../../stubs';
import { NodeIconResolver, NodeIconType } from '../../../../../utils';
import { IVisualizationNode } from '../../../base-visual-entity';
import { RootNodeMapper } from '../root-node-mapper';
import { FromNodeMapper } from './from-node-mapper';
import { noopNodeMapper } from './testing/noop-node-mapper';
import { CamelComponentSchemaService } from '../../support/camel-component-schema.service';

describe('FromNodeMapper', () => {
  let mapper: FromNodeMapper;
  let fromDefinition: { from: FromDefinition };
  let vizNode: IVisualizationNode;
  const path = 'from';

  beforeEach(() => {
    const rootNodeMapper = new RootNodeMapper();
    rootNodeMapper.registerDefaultMapper(noopNodeMapper);

    mapper = new FromNodeMapper(rootNodeMapper);

    fromDefinition = { from: { ...camelRouteJson.route.from } };

    vizNode = mapper.getVizNodeFromProcessor(
      path,
      { processorName: 'from' as keyof ProcessorDefinition },
      fromDefinition,
    );
  });

  it('should not return children', () => {
    expect(vizNode.getChildren()).toBeUndefined();
  });

  it('should build the appropriate data', () => {
    expect(vizNode.data).toEqual({
      path,
      icon: '',
      processorName: 'from',
      componentName: 'timer',
      isGroup: false,
    });
  });

  it('should delegate to the NodeIconReesolver to get the icon', () => {
    const nodeIconResolverSpy = jest.spyOn(NodeIconResolver, 'getIcon');
    jest.spyOn(CamelComponentSchemaService, 'getIconName').mockReturnValueOnce('timer');

    mapper.getVizNodeFromProcessor(path, { processorName: 'from' as keyof ProcessorDefinition }, fromDefinition);

    expect(nodeIconResolverSpy).toHaveBeenCalledWith('timer', NodeIconType.Component);
  });

  it('should create the step chain', () => {
    let currentNode = vizNode;
    let nextNode = vizNode.getNextNode();

    while (nextNode) {
      expect(currentNode.getNextNode()).toBe(nextNode);
      expect(nextNode.getPreviousNode()).toBe(currentNode);

      currentNode = nextNode;
      nextNode = currentNode?.getNextNode();
    }

    expect.assertions(6);
  });
});
