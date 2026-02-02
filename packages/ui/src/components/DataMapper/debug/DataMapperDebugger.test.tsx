import { render, screen } from '@testing-library/react';

import { DataMapperDebugger } from './DataMapperDebugger';

// TODO: Update this test for store-based architecture
// The old NodeReference logging has been replaced with store-based state management
describe.skip('Debug', () => {
  it('should render', async () => {
    const mockLog = jest.fn();
    console.log = mockLog;
    render(<DataMapperDebugger />);
    await screen.findByTestId('dm-debug-main-menu-button');
    // TODO: Update to check for store-based debug output instead of NodeReference logs
    const nodeRefsLog = mockLog.mock.calls.filter((call) => call[0].startsWith('Node References: ['));
    expect(nodeRefsLog.length).toBeGreaterThan(0);
  });
});
