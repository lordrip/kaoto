import '@testing-library/jest-dom/vitest';
import 'vitest-canvas-mock';
import { getRandomValues, subtle } from 'node:crypto';
import { TextDecoder, TextEncoder } from 'node:util';
import { vi, beforeEach } from 'vitest';

Object.defineProperties(globalThis, {
  TextDecoder: { value: TextDecoder },
  TextEncoder: { value: TextEncoder },
});

// Mock ResizeObserver for components that use it
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});

// Override requestAnimationFrame to use setTimeout so that fake timers can control it.
// jsdom's built-in polyfill captures the real setTimeout before fake timers are installed.
globalThis.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  return setTimeout(() => callback(Date.now()), 0) as unknown as number;
};
globalThis.cancelAnimationFrame = (id: number): void => {
  clearTimeout(id);
};

enableSVGElementMocks();

Object.defineProperty(window, 'fetch', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.spyOn(globalThis, 'crypto', 'get').mockImplementation(() => ({ getRandomValues, subtle }) as unknown as Crypto);

vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
  if (
    args[0]?.toString().includes('[mobx-react-lite] importing batchingForReactDom is no longer needed') ||
    args[0]?.toString().includes('NODE_ENV is not defined')
  ) {
    return;
  }

  console.log(...args);
});

const fetchMock = vi.spyOn(window, 'fetch');

beforeEach(() => {
  fetchMock.mockResolvedValue(null as unknown as Response);
});

Element.prototype.scrollIntoView = vi.fn();

function enableSVGElementMocks() {
  /**
   * Mocking the following SVG methods to avoid errors when running tests
   *
   * Taken from the following comment:
   * https://github.com/apexcharts/react-apexcharts/issues/52#issuecomment-844757362
   */

  Object.defineProperty(globalThis.SVGElement.prototype, 'getScreenCTM', {
    writable: true,
    value: vi.fn(),
  });

  Object.defineProperty(globalThis.SVGElement.prototype, 'getBBox', {
    writable: true,
    value: vi.fn().mockReturnValue({
      x: 0,
      y: 0,
    }),
  });

  Object.defineProperty(globalThis.SVGElement.prototype, 'getComputedTextLength', {
    writable: true,
    value: vi.fn().mockReturnValue(0),
  });

  Object.defineProperty(globalThis.SVGElement.prototype, 'createSVGMatrix', {
    writable: true,
    value: vi.fn().mockReturnValue({
      x: 10,
      y: 10,
      inverse: () => {},
      multiply: () => {},
    }),
  });
}
