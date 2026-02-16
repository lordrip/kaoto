import { fireEvent, render } from '@testing-library/react';

import { ChangeIntegrationTypeModal } from './ChangeIntegrationTypeModal';

describe('ChangeIntegrationTypeModal', () => {
  it('should be hidden when isOpen is false', () => {
    const wrapper = render(<ChangeIntegrationTypeModal isOpen={false} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(wrapper.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
  });

  it('should be visible when isOpen is true', () => {
    const wrapper = render(<ChangeIntegrationTypeModal isOpen onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(wrapper.queryByTestId('confirmation-modal')).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    const wrapper = render(<ChangeIntegrationTypeModal isOpen onConfirm={onConfirm} onCancel={vi.fn()} />);

    fireEvent.click(wrapper.getByTestId('confirmation-modal-confirm'));

    expect(onConfirm).toBeCalled();
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    const wrapper = render(<ChangeIntegrationTypeModal isOpen onConfirm={vi.fn()} onCancel={onCancel} />);

    fireEvent.click(wrapper.getByTestId('confirmation-modal-cancel'));

    expect(onCancel).toBeCalled();
  });

  it('should call onCancel when close button is clicked', () => {
    const onCancel = vi.fn();
    const wrapper = render(<ChangeIntegrationTypeModal isOpen onConfirm={vi.fn()} onCancel={onCancel} />);

    fireEvent.click(wrapper.getByLabelText('Close'));

    expect(onCancel).toBeCalled();
  });
});
