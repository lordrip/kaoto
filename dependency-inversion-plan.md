# Dependency Inversion Plan: Visualization Architecture Refactoring

## Current Architecture Analysis

### Current Dependency Flow
```
BaseVisualCamelEntity (Model)
    ↓ [toVizNode()]
IVisualizationNode (View Model)
    ↓ [delegates back via getBaseEntity()]
BaseVisualCamelEntity (Model)
    ↓ [consumed by]
CustomNode (React Component)
```

### Current Relationships

#### 1. `abstract-camel-visual-entity.ts` → `visualization-node.ts`
- **Creates**: AbstractCamelVisualEntity.toVizNode() creates IVisualizationNode instances
- **Owns**: Entity layer is responsible for creating the entire visualization tree
- **Controls**: Entity determines node structure, hierarchy, and properties

#### 2. `visualization-node.ts` → `abstract-camel-visual-entity.ts`
- **References**: VisualizationNode.data.entity holds reference back to BaseVisualCamelEntity
- **Delegates**: Almost all VisualizationNode methods delegate to getBaseEntity()
  - `getNodeLabel()` → `entity.getNodeLabel(path, labelType)`
  - `getTooltipContent()` → `entity.getTooltipContent(path)`
  - `updateModel()` → `entity.updateModel(path, value)`
  - `getComponentSchema()` → `entity.getComponentSchema(path)`

#### 3. `CustomNode.tsx` → `visualization-node.ts`
- **Consumes**: CustomNode receives IVisualizationNode via element.getData().vizNode
- **Calls**: Component directly calls visualization node methods for rendering
- **Depends**: UI layer depends on visualization node interface

### Problems with Current Architecture

#### 1. **Circular Dependency**
- Entity creates Node, Node references Entity back
- Creates tight coupling and circular import risks
- Makes reasoning about data flow difficult

#### 2. **Leaky Abstraction**
- VisualizationNode is just a thin delegation wrapper
- No real separation of concerns between model and view model
- Entity concerns leak into visualization layer

#### 3. **Mixed Responsibilities**
- Entity layer knows about visualization concerns (icons, labels, tooltips)
- Visualization layer knows about business logic (paths, schemas, validation)
- No clear separation between data and presentation

#### 4. **Testing Challenges**
- Can't test CustomNode in isolation without full entity setup
- Hard to mock or stub visualization behaviors
- Tightly coupled to Camel-specific business logic

#### 5. **Performance Issues**
- Constant delegation calls add overhead
- No caching of computed visualization properties
- Entity changes trigger expensive re-computation

## Proposed Dependency Inversion Strategies

### Strategy 1: Self-Contained Visualization Nodes (Recommended)

#### Concept
Transform IVisualizationNode from a delegating wrapper to a self-contained value object that contains all visualization data.

#### Implementation
```typescript
// New self-contained visualization node data
interface VisualizationNodeState {
  id: string;
  label: string;
  tooltip: string;
  icon: string;
  isDisabled: boolean;
  validationText?: string;
  nodeInteraction: NodeInteraction;
  componentSchema?: VisualComponentSchema;
  path?: string;
  processorName?: string;
  // ... all other visualization properties
}

class SelfContainedVisualizationNode implements IVisualizationNode {
  constructor(private state: VisualizationNodeState) {}

  getNodeLabel(): string { return this.state.label; }
  getTooltipContent(): string { return this.state.tooltip; }
  // ... all methods use internal state, no delegation
}
```

#### Benefits
- ✅ Eliminates circular dependency
- ✅ Enables isolated component testing
- ✅ Better performance (no delegation overhead)
- ✅ Clear separation of concerns
- ✅ Immutable visualization state

#### Migration Path
1. Create VisualizationNodeState interface
2. Create adapter that transforms Entity → VisualizationNodeState
3. Update VisualizationNode to use internal state
4. Update entity.toVizNode() to use adapter
5. Remove entity reference from node data

### Strategy 2: Adapter Pattern

#### Concept
Introduce adapters that transform entity data to visualization data, breaking direct dependencies.

#### Implementation
```typescript
interface VisualizationAdapter {
  entityToVisualizationState(entity: BaseVisualCamelEntity, path: string): VisualizationNodeState;
  updateEntity(entity: BaseVisualCamelEntity, path: string, updates: Partial<VisualizationNodeState>): void;
}

class CamelVisualizationAdapter implements VisualizationAdapter {
  entityToVisualizationState(entity: BaseVisualCamelEntity, path: string): VisualizationNodeState {
    return {
      id: entity.getId(),
      label: entity.getNodeLabel(path),
      tooltip: entity.getTooltipContent(path),
      // ... transform all needed properties
    };
  }
}
```

#### Benefits
- ✅ Clean separation of model and view concerns
- ✅ Easy to test and mock adapters
- ✅ Multiple visualization strategies possible
- ✅ Backwards compatible

### Strategy 3: Event-Driven Updates

#### Concept
Use events to sync visualization state instead of direct references.

#### Implementation
```typescript
interface VisualizationEvents {
  nodeUpdated: { nodeId: string; updates: Partial<VisualizationNodeState> };
  nodeRemoved: { nodeId: string };
  nodeAdded: { node: VisualizationNodeState };
}

class VisualizationEventBus {
  on<K extends keyof VisualizationEvents>(event: K, handler: (data: VisualizationEvents[K]) => void): void;
  emit<K extends keyof VisualizationEvents>(event: K, data: VisualizationEvents[K]): void;
}
```

#### Benefits
- ✅ Complete decoupling of layers
- ✅ Reactive updates
- ✅ Easy to add new visualization consumers
- ✅ Supports undo/redo patterns

### Strategy 4: React Context Inversion

#### Concept
Move visualization logic closer to React components using context providers.

#### Implementation
```typescript
interface VisualizationContext {
  getNodeLabel(nodeId: string, labelType?: NodeLabelType): string;
  getTooltipContent(nodeId: string): string;
  updateNode(nodeId: string, updates: unknown): void;
  // ... other visualization operations
}

const VisualizationProvider: FC<{ entities: BaseVisualCamelEntity[] }> = ({ entities, children }) => {
  const visualizationMethods = useMemo(() => ({
    getNodeLabel: (nodeId: string, labelType?: NodeLabelType) => {
      const entity = findEntityByNodeId(entities, nodeId);
      const path = findPathByNodeId(entities, nodeId);
      return entity?.getNodeLabel(path, labelType) ?? nodeId;
    },
    // ... implement other methods
  }), [entities]);

  return (
    <VisualizationContext.Provider value={visualizationMethods}>
      {children}
    </VisualizationContext.Provider>
  );
};
```

#### Benefits
- ✅ React-native approach
- ✅ Easy testing with context mocks
- ✅ Flexible provider implementations
- ✅ Supports React Suspense/Error boundaries

## Recommended Implementation Plan

### Phase 1: Create Foundation (Week 1-2)
1. **Define new interfaces**
   - `VisualizationNodeState` - self-contained node data
   - `VisualizationAdapter` - entity-to-visualization transformation
   - `VisualizationEventBus` - event communication (optional)

2. **Create adapter implementation**
   - `CamelVisualizationAdapter` that transforms BaseVisualCamelEntity to VisualizationNodeState
   - Include all current visualization properties (labels, tooltips, icons, etc.)
   - Add comprehensive unit tests

3. **Update VisualizationNode implementation**
   - Make it self-contained using VisualizationNodeState
   - Remove all delegation to getBaseEntity()
   - Keep same public interface for backwards compatibility

### Phase 2: Update Entity Layer (Week 3)
1. **Modify AbstractCamelVisualEntity.toVizNode()**
   - Use adapter to create VisualizationNodeState
   - Create self-contained VisualizationNode instances
   - Remove entity reference from node data

2. **Update all visual entity implementations**
   - Route, Rest, Kamelet, etc.
   - Ensure they work with new adapter pattern

3. **Add integration tests**
   - Test full entity-to-visualization transformation
   - Verify no regressions in existing functionality

### Phase 3: Component Layer Updates (Week 4)
1. **Update CustomNode and related components**
   - Verify they work with self-contained nodes
   - Add isolated component tests
   - Improve performance with no delegation overhead

2. **Create visualization context (optional)**
   - For operations that still need entity access
   - Like complex updates or adding/removing steps

3. **Update all visualization hooks and utilities**
   - Ensure compatibility with new architecture

### Phase 4: Cleanup and Optimization (Week 5)
1. **Remove unused code**
   - Old delegation methods
   - Unused entity references
   - Cleanup circular dependency imports

2. **Performance optimization**
   - Add caching for expensive computations
   - Optimize re-rendering with better memoization
   - Benchmark before/after performance

3. **Documentation and migration guide**
   - Update architecture documentation
   - Create migration guide for future development
   - Document new patterns and best practices

## Success Criteria

### Technical Goals
- [ ] Eliminate circular dependency between entity and visualization layers
- [ ] Enable isolated testing of visualization components
- [ ] Improve performance by removing delegation overhead
- [ ] Clear separation of model and view concerns
- [ ] Backwards compatibility maintained

### Quality Gates
- [ ] All existing tests pass
- [ ] New unit tests for adapters and self-contained nodes
- [ ] Integration tests for full transformation pipeline
- [ ] Performance benchmarks show improvement
- [ ] No memory leaks in updated architecture

### Developer Experience
- [ ] Easier to test visualization components in isolation
- [ ] Clearer code organization and dependencies
- [ ] Better IDE support with explicit interfaces
- [ ] Simplified debugging with self-contained state

## Risk Assessment and Mitigation

### High Risk: Breaking Changes
- **Risk**: Changes to IVisualizationNode interface break existing code
- **Mitigation**: Maintain backwards compatibility, gradual migration

### Medium Risk: Performance Regression
- **Risk**: New adapter layer adds overhead
- **Mitigation**: Benchmark early, optimize adapter implementation, cache computed values

### Low Risk: Complexity Increase
- **Risk**: Additional abstraction layers confuse developers
- **Mitigation**: Clear documentation, good naming, comprehensive examples

## Next Steps

1. **Review and approve this plan** with the team
2. **Create detailed technical specifications** for each phase
3. **Set up feature branch** for implementation
4. **Begin Phase 1 implementation** with adapter pattern
5. **Regular check-ins** to assess progress and adjust plan

---

*This is a living document - please update as we learn more during implementation.*