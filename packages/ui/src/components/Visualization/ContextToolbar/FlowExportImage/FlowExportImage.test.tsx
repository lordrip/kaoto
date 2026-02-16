import { useVisualizationController } from '@patternfly/react-topology';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PropsWithChildren } from 'react';

import { EntitiesProvider } from '../../../../providers/entities.provider';
import { SourceCodeProvider } from '../../../../providers/source-code.provider';
import { VisibleFlowsProvider } from '../../../../providers/visible-flows.provider';
import { FlowExportImage } from './FlowExportImage';

const { mockOnComplete } = vi.hoisted(() => ({
  mockOnComplete: vi.fn(),
}));

vi.mock('@patternfly/react-topology', () => ({
  useVisualizationController: vi.fn(),
}));

vi.mock('./HiddenCanvas', () => ({
  HiddenCanvas: ({ onComplete }: { onComplete: () => void }) => {
    mockOnComplete.mockImplementation(onComplete);
    // Simulate async export completion
    Promise.resolve().then(() => onComplete());
    return <div data-testid="mock-hidden-canvas" />;
  },
}));

type Position = { x: number; y: number };

interface MockGraph {
  getLayout: vi.Mock<string, []>;
  getGraph: () => MockGraph;
}

const wrapper = ({ children }: PropsWithChildren) => (
  <SourceCodeProvider>
    <EntitiesProvider>
      <VisibleFlowsProvider>{children}</VisibleFlowsProvider>
    </EntitiesProvider>
  </SourceCodeProvider>
);

describe('FlowExportImage', () => {
  let mockGraph: MockGraph;

  beforeEach(() => {
    mockGraph = {
      getLayout: vi.fn(() => 'DagreHorizontal'),
      getGraph() {
        return this;
      },
    };

    (useVisualizationController as vi.Mock).mockReturnValue({
      getGraph: () => mockGraph,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the export button', () => {
    render(<FlowExportImage />, { wrapper });
    expect(screen.getByTestId('exportImageButton')).toBeInTheDocument();
  });

  it('runs full export flow', async () => {
    render(<FlowExportImage />, { wrapper });

    const button = screen.getByTestId('exportImageButton');
    fireEvent.click(button);

    // Button should be disabled while exporting
    expect(button).toBeDisabled();

    // HiddenCanvas should be rendered
    await waitFor(() => {
      expect(screen.getByTestId('mock-hidden-canvas')).toBeInTheDocument();
    });

    // After export completes via onComplete callback, button should be enabled again
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it('button is re-enabled after HiddenCanvas calls onComplete', async () => {
    render(<FlowExportImage />, { wrapper });

    const button = screen.getByTestId('exportImageButton');
    fireEvent.click(button);

    expect(button).toBeDisabled();

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });
});
