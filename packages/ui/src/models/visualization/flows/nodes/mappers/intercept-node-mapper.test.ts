import { Intercept, InterceptFrom, InterceptSendToEndpoint, ProcessorDefinition } from '@kaoto/camel-catalog/types';
import { NodeIconResolver, NodeIconType } from '../../../../../utils';
import { RootNodeMapper } from '../root-node-mapper';
import { InterceptNodeMapper } from './intercept-node-mapper';
import { noopNodeMapper } from './testing/noop-node-mapper';

describe('InterceptNodeMapper', () => {
  let mapper: InterceptNodeMapper;
  const interceptDefinition: { intercept: Intercept } = {
    intercept: {
      id: 'intercept',
      steps: [{ log: 'logName' }],
    },
  };
  const interceptFromDefinition: { interceptFrom: InterceptFrom } = {
    interceptFrom: {
      id: 'interceptFrom',
      steps: [{ log: 'logName' }],
    },
  };
  const interceptSendToEndpointDefinition: { interceptSendToEndpoint: InterceptSendToEndpoint } = {
    interceptSendToEndpoint: {
      id: 'interceptSendToEndpoint',
      steps: [{ log: 'logName' }],
    },
  };

  beforeEach(() => {
    const rootNodeMapper = new RootNodeMapper();
    rootNodeMapper.registerDefaultMapper(mapper);
    rootNodeMapper.registerMapper('log', noopNodeMapper);

    mapper = new InterceptNodeMapper(rootNodeMapper);
  });

  it.each([
    ['intercept', interceptDefinition],
    ['interceptFrom', interceptFromDefinition],
    ['interceptSendToEndpoint', interceptSendToEndpointDefinition],
  ] as [string, unknown][])('should return children for %s', (path, definition) => {
    const vizNode = mapper.getVizNodeFromProcessor(
      path,
      { processorName: path as keyof ProcessorDefinition },
      definition,
    );

    expect(vizNode.getChildren()).toHaveLength(1);
  });

  it.each([
    ['intercept', interceptDefinition],
    ['interceptFrom', interceptFromDefinition],
    ['interceptSendToEndpoint', interceptSendToEndpointDefinition],
  ] as [string, unknown][])('should delegate the icon lookup to the NodeIconResolver for %s', (path, definition) => {
    const nodeIconResolverSpy = jest.spyOn(NodeIconResolver, 'getIcon').mockReturnValueOnce('icon');

    const vizNode = mapper.getVizNodeFromProcessor(
      path,
      { processorName: path as keyof ProcessorDefinition },
      definition,
    );

    expect(vizNode.data.icon).toEqual('icon');
    expect(nodeIconResolverSpy).toHaveBeenCalledWith(path, NodeIconType.VisualEntity);
  });

  it.each([
    ['intercept', interceptDefinition],
    ['interceptFrom', interceptFromDefinition],
    ['interceptSendToEndpoint', interceptSendToEndpointDefinition],
  ] as [string, unknown][])('should prepare the appropriate data for %s', (path, definition) => {
    const vizNode = mapper.getVizNodeFromProcessor(
      path,
      { processorName: path as keyof ProcessorDefinition },
      definition,
    );

    expect(vizNode.data).toEqual({
      path,
      icon: '',
      processorName: path as keyof ProcessorDefinition,
      isGroup: true,
    });
  });
});
