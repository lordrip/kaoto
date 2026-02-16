import { Edge, EdgeModel } from '@patternfly/react-topology';

import { CatalogModalContextValue } from '../../../dynamic-catalog/catalog-modal.provider';
import { AddStepMode, IVisualizationNode } from '../../../models/visualization/base-visual-entity';
import { EntitiesContextResult } from '../../../providers';
import { canDropOnEdge } from './customComponentUtils';

describe('canDropOnEdge', () => {
  const getMockVizNode = (id: string): IVisualizationNode => {
    return {
      id,
      data: { path: `route.from.steps.${id}` },
      getNextNode: vi.fn(),
      getPreviousNode: vi.fn(),
      getCopiedContent: vi.fn().mockReturnValue({ name: 'test-component' }),
      getNodeDefinition: vi.fn().mockReturnValue({}),
    } as unknown as IVisualizationNode;
  };

  const createMockEdge = (
    sourceVizNode: IVisualizationNode,
    targetVizNode: IVisualizationNode,
  ): Edge<EdgeModel, unknown> => {
    const mockSource = {
      getData: vi.fn().mockReturnValue({ vizNode: sourceVizNode }),
    };
    const mockTarget = {
      getData: vi.fn().mockReturnValue({ vizNode: targetVizNode }),
    };

    return {
      getSource: vi.fn().mockReturnValue(mockSource),
      getTarget: vi.fn().mockReturnValue(mockTarget),
    } as unknown as Edge<EdgeModel, unknown>;
  };

  const createMockCamelResource = (): EntitiesContextResult['camelResource'] => {
    return {
      getCompatibleComponents: vi.fn().mockReturnValue([]),
    } as unknown as EntitiesContextResult['camelResource'];
  };

  const createMockCatalogModalContext = (): CatalogModalContextValue => {
    return {
      checkCompatibility: vi.fn().mockReturnValue(true),
      setIsModalOpen: vi.fn(),
      getNewComponent: vi.fn(),
    } as unknown as CatalogModalContextValue;
  };

  let draggedVizNode: IVisualizationNode;
  let sourceVizNode: IVisualizationNode;
  let targetVizNode: IVisualizationNode;
  let edge: Edge<EdgeModel, unknown>;
  let camelResource: EntitiesContextResult['camelResource'];
  let catalogModalContext: CatalogModalContextValue;

  beforeEach(() => {
    draggedVizNode = getMockVizNode('dragged');
    sourceVizNode = getMockVizNode('source');
    targetVizNode = getMockVizNode('target');
    edge = createMockEdge(sourceVizNode, targetVizNode);
    camelResource = createMockCamelResource();
    catalogModalContext = createMockCatalogModalContext();
  });

  it("should return false when dragged node's next node is the following node", () => {
    (draggedVizNode.getNextNode as vi.Mock).mockReturnValue(targetVizNode);

    const result = canDropOnEdge(draggedVizNode, edge, camelResource, catalogModalContext);

    expect(result).toBe(false);
    expect(camelResource.getCompatibleComponents).not.toHaveBeenCalled();
    expect(catalogModalContext.checkCompatibility).not.toHaveBeenCalled();
  });

  it("should return false when dragged node's previous node is the preceding node", () => {
    (draggedVizNode.getPreviousNode as vi.Mock).mockReturnValue(sourceVizNode);

    const result = canDropOnEdge(draggedVizNode, edge, camelResource, catalogModalContext);

    expect(result).toBe(false);
    expect(camelResource.getCompatibleComponents).not.toHaveBeenCalled();
    expect(catalogModalContext.checkCompatibility).not.toHaveBeenCalled();
  });

  it('should return false when following node is a placeholder', () => {
    targetVizNode.data.isPlaceholder = true;

    const result = canDropOnEdge(draggedVizNode, edge, camelResource, catalogModalContext);

    expect(result).toBe(false);
    expect(camelResource.getCompatibleComponents).not.toHaveBeenCalled();
    expect(catalogModalContext.checkCompatibility).not.toHaveBeenCalled();
  });

  it('should return false when checkCompatibility returns false', () => {
    const mockFilter = ['filter1', 'filter2'];
    (camelResource.getCompatibleComponents as vi.Mock).mockReturnValue(mockFilter);
    (catalogModalContext.checkCompatibility as vi.Mock).mockReturnValue(false);

    const result = canDropOnEdge(draggedVizNode, edge, camelResource, catalogModalContext);

    expect(result).toBe(false);
    expect(camelResource.getCompatibleComponents).toHaveBeenCalledWith(
      AddStepMode.PrependStep,
      targetVizNode.data,
      targetVizNode.getNodeDefinition(),
    );
    expect(catalogModalContext.checkCompatibility).toHaveBeenCalledWith('test-component', mockFilter);
  });

  it('should return true when all conditions pass and checkCompatibility returns true', () => {
    const mockFilter = ['filter1', 'filter2'];
    (camelResource.getCompatibleComponents as vi.Mock).mockReturnValue(mockFilter);
    (catalogModalContext.checkCompatibility as vi.Mock).mockReturnValue(true);

    const result = canDropOnEdge(draggedVizNode, edge, camelResource, catalogModalContext);

    expect(result).toBe(true);
    expect(camelResource.getCompatibleComponents).toHaveBeenCalledWith(
      AddStepMode.PrependStep,
      targetVizNode.data,
      targetVizNode.getNodeDefinition(),
    );
    expect(catalogModalContext.checkCompatibility).toHaveBeenCalledWith('test-component', mockFilter);
  });

  it('should return false when checkCompatibility returns undefined', () => {
    const mockFilter = ['filter1'];
    (camelResource.getCompatibleComponents as vi.Mock).mockReturnValue(mockFilter);
    (catalogModalContext.checkCompatibility as vi.Mock).mockReturnValue(undefined);

    const result = canDropOnEdge(draggedVizNode, edge, camelResource, catalogModalContext);

    expect(result).toBe(false);
  });
});
