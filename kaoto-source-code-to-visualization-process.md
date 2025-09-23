# Kaoto Source Code to Visualization Nodes Process

## Overview

This document describes how Kaoto reads source code and transforms it into `IVisualizationNode` objects for rendering in the visual canvas. The process involves multiple layers of abstraction, from raw source code parsing to creating interactive visualization nodes.

## Process Flow

### 1. Entry Point: EntitiesProvider (`packages/ui/src/providers/entities.provider.tsx`)

The `EntitiesProvider` is the main React context provider that manages the entire source code to visualization transformation:

**Key responsibilities:**
- Receives source code through `SourceCodeContext`
- Creates and manages `CamelResource` instances
- Provides entities and visual entities to the application
- Handles updates when source code changes

**Initial transformation (lines 54-58):**
```typescript
let initialCamelResource: CamelResource;
try {
  initialCamelResource = CamelResourceFactory.createCamelResource(initialSourceCode, { path: fileExtension });
} catch (error) {
  initialCamelResource = CamelResourceFactory.createCamelResource('', { path: fileExtension });
}
```

**Event handling (lines 67-77):**
- Listens for `code:updated` events to recreate `CamelResource`
- Updates entities and visual entities when source code changes

### 2. Source Code Parsing: CamelResourceFactory (`packages/ui/src/models/camel/camel-resource-factory.ts`)

**Purpose:** Factory responsible for creating appropriate `CamelResource` instances based on source code and file type.

**Key method:** `createCamelResource(source?: string, options: Partial<{ path: string }> = {})`

**Process (lines 18-30):**
1. Determines resource type from file path
2. Initializes appropriate serializer (XML or YAML)
3. Parses source code using serializer
4. Creates specialized resource (Integration, KameletBinding, Pipe, etc.) or defaults to `CamelRouteResource`

**Serializer selection (lines 32-44):**
- XML files: `XmlCamelResourceSerializer`
- YAML/other files: `YamlCamelResourceSerializer`
- Auto-detection based on content if no path provided

### 3. Source Code Serialization (`packages/ui/src/serializers/`)

**YAML Serializer (`yaml-camel-resource-serializer.ts`):**
- Uses `yaml.parse()` to convert YAML string to JSON object
- Extracts and preserves comments
- Returns `CamelYamlDsl | Integration | Kamelet | KameletBinding | Pipe`

**XML Serializer (similar process for XML content):**
- Parses XML to JSON representation
- Preserves XML-specific metadata (declarations, namespaces)

### 4. CamelResource Implementation: CamelRouteResource (`packages/ui/src/models/camel/camel-route-resource.ts`)

**Key responsibilities:**
- Stores parsed entities from source code
- Provides `getVisualEntities()` and `getEntities()` methods
- Manages supported entity types (Route, RouteConfiguration, Intercept, etc.)

**Entity creation (lines 85-101):**
```typescript
constructor(rawEntities?: CamelYamlDsl, private serializer: CamelResourceSerializer = new YamlCamelResourceSerializer()) {
  if (!rawEntities) return;

  const entities = Array.isArray(rawEntities) ? rawEntities : [rawEntities];
  const parsedEntities = entities.reduce((acc, rawItem) => {
    const entity = this.getEntity(rawItem);
    if (isDefined(entity) && typeof entity === 'object') {
      acc.push(entity);
    }
    return acc;
  }, [] as BaseCamelEntity[]);

  this.entities = EntityOrderingService.sortEntitiesForSerialization(parsedEntities);
}
```

**Supported entity types (lines 50-76):**
- Route, RouteConfiguration, Intercept, InterceptFrom, etc.
- Each type mapped to specific visual entity class
- Some entities are YAML-only

**Key methods:**
- `getVisualEntities()`: Returns entities that can be visualized (lines 183-189)
- `getEntities()`: Returns non-visual entities (lines 191-193)

### 5. Visual Entity Abstraction: BaseVisualCamelEntity (`packages/ui/src/models/visualization/base-visual-entity.ts`)

**Interface definition (`BaseVisualCamelEntity`):**
- Extends `BaseCamelEntity` with visualization-specific capabilities
- Provides methods for node interaction, labeling, and manipulation
- Defines `toVizNode()` method for creating visualization nodes

**Key methods required:**
- `getNodeLabel()`, `getNodeTitle()`, `getTooltipContent()`: UI display
- `getComponentSchema()`: Component configuration schema
- `addStep()`, `removeStep()`: Flow manipulation
- `getNodeInteraction()`: UI interaction capabilities
- `toVizNode()`: **Creates IVisualizationNode tree**

### 6. Visual Entity Implementation: AbstractCamelVisualEntity (`packages/ui/src/models/visualization/flows/abstract-camel-visual-entity.ts`)

**Core implementation of BaseVisualCamelEntity interface.**

**Key transformation method `toVizNode()` (lines 242-282):**
```typescript
toVizNode(): IVisualizationNode {
  // Create root group node for the route
  const routeGroupNode = createVisualizationNode(this.getRootPath(), {
    path: this.getRootPath(),
    entity: this,
    isGroup: true,
    icon: NodeIconResolver.getIcon(this.type, NodeIconType.Entity),
    processorName: 'route',
  });

  // Create 'from' node (route source)
  const fromNode = NodeMapperService.getVizNode(
    `${this.getRootPath()}.from`,
    {
      processorName: 'from' as keyof ProcessorDefinition,
      componentName: CamelComponentSchemaService.getComponentNameFromUri(this.getRootUri()!),
    },
    this.entityDef,
  );

  // Handle placeholder for missing URI
  if (!this.getRootUri()) {
    fromNode.data.icon = NodeIconResolver.getPlaceholderIcon();
  }

  // Build node tree with parent-child and sibling relationships
  routeGroupNode.addChild(fromNode);
  // ... additional tree building logic

  return routeGroupNode;
}
```

### 7. Node Mapping Service: NodeMapperService (`packages/ui/src/models/visualization/flows/nodes/node-mapper.service.ts`)

**Purpose:** Maps individual Camel processors to `IVisualizationNode` instances.

**Mapping strategy:**
- Uses different mappers for different processor types
- Supports specialized mappers for complex processors (Choice, CircuitBreaker, etc.)
- Falls back to `BaseNodeMapper` for standard processors

**Registered mappers (lines 37-55):**
- `circuitBreaker` → `CircuitBreakerNodeMapper`
- `choice` → `ChoiceNodeMapper`
- `when` → `WhenNodeMapper`
- `otherwise` → `OtherwiseNodeMapper`
- `step` → `StepNodeMapper`
- etc.

### 8. Visualization Node: IVisualizationNode (`packages/ui/src/models/visualization/base-visual-entity.ts`)

**Interface definition (lines 93-149):**
```typescript
export interface IVisualizationNode<T extends IVisualizationNodeData = IVisualizationNodeData> {
  id: string;
  data: T;
  lastUpdate: number;

  // Node information methods
  getId(): string | undefined;
  getNodeLabel(labelType?: NodeLabelType): string;
  getTooltipContent(): string;
  getNodeTitle(): string;

  // Tree structure methods
  getParentNode(): IVisualizationNode | undefined;
  setParentNode(parentNode?: IVisualizationNode): void;
  getPreviousNode(): IVisualizationNode | undefined;
  setPreviousNode(previousNode?: IVisualizationNode): void;
  getNextNode(): IVisualizationNode | undefined;
  setNextNode(node?: IVisualizationNode): void;
  getChildren(): IVisualizationNode[] | undefined;
  addChild(child: IVisualizationNode): void;

  // Interaction methods
  addBaseEntityStep(definedComponent: DefinedComponent, mode: AddStepMode): void;
  removeChild(): void;
  updateModel(value: unknown): void;
  getNodeInteraction(): NodeInteraction;

  // Additional capabilities
  canDragNode(): boolean;
  canDropOnNode(): boolean;
  getComponentSchema(): VisualComponentSchema | undefined;
}
```

**Implementation:** `VisualizationNode` class (`packages/ui/src/models/visualization/visualization-node.ts`)

### 9. Node Data Structure: IVisualizationNodeData (`packages/ui/src/models/visualization/base-visual-entity.ts`)

**Interface (lines 151-158):**
```typescript
export interface IVisualizationNodeData {
  icon?: string;
  path?: string;
  entity?: BaseVisualCamelEntity;
  isPlaceholder?: boolean;
  isGroup?: boolean;
  [key: string]: unknown;
}
```

**Key properties:**
- `path`: JSONPath to the processor in the entity definition
- `entity`: Reference back to the containing visual entity
- `icon`: Display icon for the node
- `isGroup`: Whether this node represents a group/container
- `isPlaceholder`: Whether this is a placeholder node

## Requirements Summary

### Input Requirements:
1. **Source code**: YAML or XML string containing Camel route definitions
2. **File extension**: Used to determine serializer type and supported entity types
3. **Valid Camel syntax**: Must conform to Camel DSL schema

### Processing Requirements:
1. **Serializer support**: YAML and XML parsers with comment preservation
2. **Entity type detection**: Must identify different Camel constructs (routes, configurations, etc.)
3. **Schema validation**: Component definitions must match Camel catalog
4. **Tree structure**: Must maintain parent-child and sibling relationships

### Output Requirements:
1. **IVisualizationNode tree**: Hierarchical structure representing the flow
2. **Interactive capabilities**: Nodes must support drag/drop, editing, etc.
3. **Visual properties**: Icons, labels, tooltips for each node
4. **Bidirectional sync**: Changes to nodes must update the underlying entity

### Key Files and Methods Involved:

| File | Key Methods | Purpose |
|------|-------------|---------|
| `entities.provider.tsx` | N/A (React Context) | Entry point, event handling |
| `camel-resource-factory.ts` | `createCamelResource()` | Factory for creating resources |
| `yaml-camel-resource-serializer.ts` | `parse()`, `serialize()` | YAML parsing/serialization |
| `camel-route-resource.ts` | `getVisualEntities()`, `getEntities()` | Entity management |
| `abstract-camel-visual-entity.ts` | `toVizNode()` | Visual entity to node conversion |
| `node-mapper.service.ts` | `getVizNode()` | Processor to node mapping |
| `visualization-node.ts` | `createVisualizationNode()` | Node creation and management |

## Data Flow Summary:

```
Source Code (YAML/XML)
    ↓ [Serializer.parse()]
JSON/Object Representation
    ↓ [CamelResourceFactory.createCamelResource()]
CamelResource with Entities
    ↓ [CamelResource.getVisualEntities()]
BaseVisualCamelEntity[]
    ↓ [entity.toVizNode()]
IVisualizationNode Tree
    ↓ [Rendered in Canvas]
Visual Flow Representation
```

This process ensures that any valid Camel route definition can be parsed, transformed into a manageable object model, and rendered as an interactive visual flow in the Kaoto editor.