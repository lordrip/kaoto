import { act, fireEvent, render, screen } from '@testing-library/react';

import { createVisualizationNode, IVisualizationNodeData } from '../../../../models';
import { TestProvidersWrapper } from '../../../../stubs';
import { PlaceholderNodeObserver } from './PlaceholderNode';

/**
 * All variables referenced inside vi.mock() factories must be hoisted,
 * because vi.mock() is moved to the top of the file before any other code.
 * We also need mock classes for @patternfly/react-topology because
 * vi.importActual('@patternfly/react-topology') fails: its transitive
 * dependency @patternfly/react-icons has extensionless ESM imports that
 * break in Vitest's module resolution.
 */
const { mockOnReplaceNode, mockOnInsertStep, MockElementContext, MockBaseEdge, MockBaseNode } = vi.hoisted(() => {
  const { createContext } = require('react');
  const MockElementContext = createContext(null);

  class MockBaseElement {
    _data: Record<string, unknown> = {};
    _type = '';
    _bounds = { x: 0, y: 0, width: 90, height: 75 };

    getType() {
      return this._type;
    }
    setType(type: string) {
      this._type = type;
    }
    getData() {
      return this._data;
    }
    setData(data: Record<string, unknown>) {
      this._data = data;
    }
    setController(_controller: unknown) {}
    setParent(_parent: unknown) {}
    getBounds() {
      return this._bounds;
    }
    getLabel() {
      return '';
    }
    getKind() {
      return 'node';
    }
  }

  class MockBaseEdge extends MockBaseElement {
    getKind() {
      return 'edge';
    }
  }

  class MockBaseNode extends MockBaseElement {
    getKind() {
      return 'node';
    }
  }

  return {
    mockOnReplaceNode: vi.fn(),
    mockOnInsertStep: vi.fn(),
    MockElementContext,
    MockBaseEdge,
    MockBaseNode,
  };
});

vi.mock('@patternfly/react-icons', () => ({
  CodeBranchIcon: () => <svg data-testid="code-branch-icon" />,
  PlusCircleIcon: () => <svg data-testid="plus-circle-icon" />,
}));

vi.mock('@patternfly/react-core', () => ({
  Icon: ({ children }: { children: React.ReactNode }) => <span data-testid="mock-icon">{children}</span>,
}));

vi.mock('@patternfly/react-topology', () => {
  return {
    isNode: (element: { getKind: () => string }) => element?.getKind?.() === 'node',
    observer: (component: React.ComponentType) => component,
    Layer: ({ children }: { children: React.ReactNode }) => <g data-testid="mock-layer">{children}</g>,
    useAnchor: vi.fn(),
    useDndDrop: vi.fn(() => [{ droppable: false, hover: false, canDrop: false }, vi.fn()]),
    AnchorEnd: { both: 'both', source: 'source', target: 'target' },
    DEFAULT_LAYER: 'default',
    Rect: class {
      x = 0;
      y = 0;
      width = 90;
      height = 75;
    },
    ElementContext: MockElementContext,
    VisualizationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    BaseEdge: MockBaseEdge,
    BaseNode: MockBaseNode,
    NodeShape: { rect: 'rect' },
    EdgeStyle: { solid: 'solid' },
    ModelKind: { graph: 'graph', node: 'node', edge: 'edge' },
  };
});

vi.mock('../../Canvas/controller.service', () => ({
  ControllerService: {
    createController: vi.fn(),
  },
}));

vi.mock('../target-anchor', () => ({
  TargetAnchor: vi.fn(),
}));

vi.mock('../customComponentUtils', () => ({
  NODE_DRAG_TYPE: 'node-drag',
}));

vi.mock('./CustomNodeUtils', () => ({
  checkNodeDropCompatibility: vi.fn(() => false),
}));

vi.mock('../../Canvas/canvas.defaults', () => ({
  CanvasDefaults: {
    DEFAULT_LABEL_WIDTH: 150,
    DEFAULT_LABEL_HEIGHT: 24,
    DEFAULT_NODE_SHAPE: 'rect',
    DEFAULT_NODE_WIDTH: 90,
    DEFAULT_NODE_HEIGHT: 75,
    ADD_STEP_ICON_SIZE: 40,
    EDGE_TERMINAL_SIZE: 6,
    DEFAULT_GROUP_PADDING: 40,
    STEP_TOOLBAR_WIDTH: 60,
    STEP_TOOLBAR_HEIGHT: 60,
    HOVER_DELAY_IN: 200,
    HOVER_DELAY_OUT: 500,
    CANVAS_FIT_PADDING: 80,
  },
}));

vi.mock('../hooks/replace-step.hook', () => ({
  useReplaceStep: vi.fn(() => ({ onReplaceNode: mockOnReplaceNode })),
}));

vi.mock('../hooks/insert-step.hook', () => ({
  useInsertStep: vi.fn(() => ({ onInsertStep: mockOnInsertStep })),
}));

describe('PlaceholderNode', () => {
  beforeEach(() => {
    mockOnReplaceNode.mockClear();
    mockOnInsertStep.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should throw an error if not used on Node elements', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const edgeElement = new MockBaseEdge();

    expect(() => {
      act(() => {
        render(<PlaceholderNodeObserver element={edgeElement as never} />);
      });
    }).toThrow('PlaceholderNode must be used only on Node elements');
  });

  it('should render without error', () => {
    const element = new MockBaseNode();
    element.setType('node');

    const { Provider } = TestProvidersWrapper();

    const wrapper = render(
      <Provider>
        <MockElementContext.Provider value={element}>
          <PlaceholderNodeObserver element={element as never} />
        </MockElementContext.Provider>
      </Provider>,
    );

    expect(wrapper.asFragment()).toMatchSnapshot();
  });

  describe('isSpecialChildPlaceholder', () => {
    const setupWithVizNode = (vizNodeData: Partial<IVisualizationNodeData>) => {
      const element = new MockBaseNode();
      element.setType('node');

      const vizNode = createVisualizationNode('test-placeholder', {
        path: 'test.placeholder',
        isPlaceholder: true,
        ...vizNodeData,
      } as IVisualizationNodeData);

      element.setData({ vizNode });

      const { Provider } = TestProvidersWrapper();

      return render(
        <Provider>
          <MockElementContext.Provider value={element}>
            <PlaceholderNodeObserver element={element as never} />
          </MockElementContext.Provider>
        </Provider>,
      );
    };

    it('should render CodeBranchIcon for special child placeholder', () => {
      const wrapper = setupWithVizNode({ name: 'placeholder-special-child' });

      // CodeBranchIcon has a specific path, check for its presence via SVG content
      const svgIcon = wrapper.container.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
      expect(wrapper.asFragment()).toMatchSnapshot();
    });

    it('should render PlusCircleIcon for regular placeholder', () => {
      const wrapper = setupWithVizNode({ name: 'placeholder' });

      const svgIcon = wrapper.container.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
      expect(wrapper.asFragment()).toMatchSnapshot();
    });

    it('should call onInsertStep when clicking on special child placeholder', () => {
      setupWithVizNode({ name: 'placeholder-special-child' });

      const placeholderNode = screen.getByTestId('placeholder-node__test-placeholder');
      fireEvent.click(placeholderNode);

      expect(mockOnInsertStep).toHaveBeenCalledTimes(1);
      expect(mockOnReplaceNode).not.toHaveBeenCalled();
    });

    it('should call onReplaceNode when clicking on regular placeholder', () => {
      setupWithVizNode({ name: 'placeholder' });

      const placeholderNode = screen.getByTestId('placeholder-node__test-placeholder');
      fireEvent.click(placeholderNode);

      expect(mockOnReplaceNode).toHaveBeenCalledTimes(1);
      expect(mockOnInsertStep).not.toHaveBeenCalled();
    });
  });
});
