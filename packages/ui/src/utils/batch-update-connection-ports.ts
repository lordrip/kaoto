/**
 * Batches connection port position updates by querying the DOM directly
 * instead of relying on individual node effects. This is much more efficient
 * during scroll events where many nodes need position updates simultaneously.
 */

import { useDocumentTreeStore } from '../store/document-tree.store';

let rafId: number | null = null;

/**
 * Updates all visible connection port positions by querying the DOM.
 * Uses requestAnimationFrame to debounce and batch updates to once per frame.
 */
export const batchUpdateConnectionPorts = () => {
  // Cancel any pending update
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
  }

  rafId = requestAnimationFrame(() => {
    rafId = null;

    // Query all connection port elements from the DOM
    const portElements = document.querySelectorAll<HTMLElement>('[data-connection-port="true"]');

    if (portElements.length === 0) {
      return;
    }

    // Build the updates object by reading positions from DOM
    const updates: Record<string, [number, number]> = {};

    portElements.forEach((element) => {
      const nodePath = element.dataset.nodePath;
      if (!nodePath) return;

      const rect = element.getBoundingClientRect();
      const centerOffset = rect.height / 2;
      const position: [number, number] = [rect.x + centerOffset, rect.y + centerOffset];

      updates[nodePath] = position;
    });

    // Perform a single batched update to the store
    // This updates all ports and increments the version counter in one operation
    useDocumentTreeStore.getState().setBatchConnectionPorts(updates);
  });
};
