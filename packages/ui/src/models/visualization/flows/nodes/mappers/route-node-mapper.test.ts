import { ProcessorDefinition, RouteDefinition } from '@kaoto/camel-catalog/types';
import { camelRouteJson } from '../../../../../stubs';
import { IVisualizationNode } from '../../../base-visual-entity';
import { RootNodeMapper } from '../root-node-mapper';
import { FromNodeMapper } from './from-node-mapper';
import { RouteNodeMapper } from './route-node-mapper';
import { noopNodeMapper } from './testing/noop-node-mapper';

describe('RouteNodeMapper', () => {
  let mapper: RouteNodeMapper;
  let routeDefinition: { route: RouteDefinition };
  let vizNode: IVisualizationNode;
  const path = 'route';

  beforeEach(() => {
    const rootNodeMapper = new RootNodeMapper();
    const fromNodeMapper = new FromNodeMapper(rootNodeMapper);
    rootNodeMapper.registerDefaultMapper(noopNodeMapper);
    rootNodeMapper.registerMapper('from' as keyof ProcessorDefinition, fromNodeMapper);

    mapper = new RouteNodeMapper(rootNodeMapper);

    routeDefinition = { ...camelRouteJson } as { route: RouteDefinition };

    vizNode = mapper.getVizNodeFromProcessor(
      path,
      { processorName: 'route' as keyof ProcessorDefinition },
      routeDefinition,
    );
  });

  it('should set the correct data', () => {
    expect(vizNode.data.path).toEqual('route');
    expect(vizNode.data.isGroup).toEqual(true);
  });

  it('should return children', () => {
    const [fromNode, setHeaderNode, choiceNode, toNode] = vizNode.getChildren()!;

    expect(fromNode.getParentNode()).toEqual(vizNode);
    expect(setHeaderNode.getParentNode()).toEqual(vizNode);
    expect(choiceNode.getParentNode()).toEqual(vizNode);
    expect(toNode.getParentNode()).toEqual(vizNode);
  });
});
