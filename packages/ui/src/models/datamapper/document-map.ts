import { VisualizationService } from '../../services/visualization.service';
import { DocumentNodeData, NodeData } from './visualization';

/** Initial parse depth for schema processing */
export const INITIAL_PARSE_DEPTH = 3;

export interface NodeDataEntry {
  nodeData: NodeData;
  rank: number;
}

export class DocumentMap {
  public items: Record<string, NodeDataEntry> = {};

  constructor(public readonly root: DocumentNodeData) {
    this.addItem(root, 0);
    this.parseNodeData(root, INITIAL_PARSE_DEPTH);
  }

  public addItem(nodeData: NodeData, rank: number): void {
    const id = nodeData.path.toString();
    this.items[id] = { nodeData, rank };
  }

  public getItem(id: string): NodeDataEntry | undefined {
    return this.items[id];
  }

  public parseNodeData(rootNodeData: NodeData, maxDepth = 1): void {
    const queue: Array<{ nodeData: NodeData; depth: number }> = [{ nodeData: rootNodeData, depth: 0 }];

    while (queue.length > 0) {
      const { nodeData, depth } = queue.shift()!;

      this.addItem(nodeData, depth);

      if (depth >= maxDepth || nodeData.isPrimitive) {
        continue;
      }

      const childrenNodeData = VisualizationService.generateNodeDataChildren(nodeData);
      for (const childNodeData of childrenNodeData) {
        queue.push({ nodeData: childNodeData, depth: depth + 1 });
      }
    }
  }
}
