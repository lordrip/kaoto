# Serverless Workflow — Kaoto Integration Spec

> **Purpose:** Implementation blueprint for a POC that parses a [Serverless Workflow (SWF) 1.0.3](https://github.com/serverlessworkflow/specification) YAML document and renders it on the Kaoto canvas as `IVisualizationNode` trees.
>
> A human must review and sign all AI-generated code before it is merged. See [`AGENTS.md`](../../../../AGENTS.md).

---

## 1. Source Material

| Artefact | Location |
|---|---|
| SWF JSON Schema | `/home/ricmarti/repos/serverlessworkflow-spec/schema/workflow.yaml` |
| Spec version | `1.0.3` — `$id: https://serverlessworkflow.io/schemas/1.0.3/workflow.yaml` |
| Schema format | YAML-encoded JSON Schema Draft 2020-12, **single self-contained file** (no `$ref` to external files) |
| Camel YAML DSL catalog | `packages/ui/dist/camel-catalog/camel-main/4.20.0/camelYamlDsl-*.json` |

---

## 2. SWF Document Structure (quick reference)

A minimal valid workflow:

```yaml
document:
  dsl: '1.0.3'
  namespace: examples
  name: my-workflow
  version: '0.1.0'
do:
  - stepA:
      call: http
      with:
        method: get
        endpoint: https://example.com/api
  - stepB:
      set:
        result: ${ .stepA }
```

### Top-level properties

| Property | Required | Type | Description |
|---|---|---|---|
| `document` | ✅ | object | Metadata: `dsl`, `namespace`, `name`, `version` (all required) + optional `title`, `summary`, `tags`, `metadata` |
| `do` | ✅ | `taskList` | Ordered list of named tasks |
| `input` | ❌ | object | Input schema / filter |
| `output` | ❌ | object | Output schema / filter |
| `use` | ❌ | object | Reusable `authentications`, `errors`, `extensions`, `functions`, `retries`, `secrets`, `timeouts`, `catalogs` |
| `timeout` | ❌ | object\|string | Workflow-level timeout |
| `schedule` | ❌ | object | Trigger schedule: `every`, `cron`, `after`, `on` (event-based) |

### taskList

A `taskList` is an **array of single-key objects** where the key is the task's user-defined name and the value is the task definition:

```yaml
do:
  - myTaskName:      # ← user-defined name, becomes the node ID
      call: http     # ← task type discriminator
      with:
        method: get
        endpoint: https://...
```

---

## 3. Task Type Taxonomy

Task type is **duck-typed**: determined by the presence of one discriminator key inside the task object.

| Discriminator key | Task type | Container? | Camel EIP analogue | Match quality |
|---|---|---|---|---|
| `call: http` | CallHttpTask | ❌ | `ToDefinition` (http component) | Strong |
| `call: openapi` | CallOpenApiTask | ❌ | `ToDefinition` + rest DSL | Strong |
| `call: grpc` | CallGrpcTask | ❌ | `ToDefinition` (grpc component) | Partial |
| `call: asyncapi` | CallAsyncApiTask | ❌ | `ToDefinition` / `FromDefinition` | Partial |
| `call: <custom>` | CallCustomTask | ❌ | `KameletDefinition` | Partial |
| `do` | DoTask | ✅ | `PipelineDefinition` / `StepDefinition` | **Exact** |
| `fork` | ForkTask | ✅ | `MulticastDefinition` | **Exact** |
| `for` | ForTask | ✅ | `SplitDefinition` | **Exact** |
| `switch` | SwitchTask | ✅ | `ChoiceDefinition` | **Exact** |
| `try` | TryTask | ✅ | `TryDefinition` | **Exact** |
| `emit` | EmitTask | ❌ | `ToDefinition` (CloudEvents component) | Partial |
| `listen` | ListenTask | ❌ | `FromDefinition` (event consumer) | Partial |
| `raise` | RaiseTask | ❌ | `ThrowExceptionDefinition` | Strong |
| `run` | RunTask | ❌ | No Camel EIP (camel-exec component) | None |
| `set` | SetTask | ❌ | `SetVariableDefinition` / `SetBodyDefinition` | Strong |
| `wait` | WaitTask | ❌ | `DelayDefinition` | **Exact** |

### taskBase (inherited by all tasks)

Every task definition can also carry these cross-cutting properties:

```yaml
if: <runtime-expression>   # conditional execution guard
input:                     # input schema / filter
output:                    # output schema / filter
export:                    # export to workflow context
timeout: <duration>|<ref>
then: continue|exit|end|<taskName>  # explicit flow control (DAG edges)
```

---

## 4. Key Structural Differences vs. Camel YAML DSL

| Dimension | Camel YAML DSL 4.20.0 | Serverless Workflow 1.0.3 |
|---|---|---|
| Top-level unit | `Route` (from → steps) | `Workflow` (document + do) |
| Task list structure | Array of typed step objects under `steps:` | Array of `{ taskName: taskDef }` single-property objects |
| Task type discrimination | Key name (`filter:`, `split:`, `to:`) | Presence of `call`/`do`/`fork`/`switch`/etc. key |
| Control flow | Implicit sequential; branching via EIPs | Explicit via `then:` — any task can jump to any named task (DAG) |
| Expression language | Simple, JsonPath, XPath, Groovy, jq, … | jq (default), jexl3, groq |
| Event model | Camel Exchange; CloudEvents via component | CloudEvents v1.0 first-class (`emit` / `listen`) |
| Error handling | try/doCatch + global onException + DLC | `tryTask` inline + error filters with status/type matchers |
| Reusable components | `RouteTemplate` / `Kamelet` | `use.functions`, `use.authentications`, `use.retries`, `use.catalogs` |
| Scheduling / trigger | Encoded in `from:` URI (timer, cron, quartz) | Top-level `schedule:` property |
| Container execution | No native concept | First-class `run: container/script/shell/workflow` |

> **Important for the canvas renderer:** because any task can point to any other via `then:`, the
> visualization is a **DAG**, not a strict tree. The POC should render tasks sequentially for the
> common case (`then: continue` / absent `then`) and show explicit jump edges as labelled arrows.

---

## 5. Implementation Plan

### 5.1 File structure to create

All new files go under `packages/ui/src/models/serverless-workflow/`:

```
packages/ui/src/models/serverless-workflow/
├── SPEC.md                                      ← this file
├── index.ts                                     ← barrel export
├── entities/
│   └── Workflow.ts                              ← TypeScript types for the SWF DSL
├── swf-resource-factory.ts                      ← detects SWF YAML and creates the resource
├── swf-resource.ts                              ← implements KaotoResource
├── swf-visual-entity.ts                         ← implements BaseVisualEntity → toVizNode()
└── support/
    ├── swf-schema.service.ts                    ← maps task paths → JSON schema fragments
    └── swf-task-utils.ts                        ← task type detection helpers
```

### 5.2 Touch points in existing code

| File | Change |
|---|---|
| `packages/ui/src/models/camel/source-schema-type.ts` | Add `SWF = 'SWF'` to `SourceSchemaType` enum; add path detection logic (`.swf.yaml`, `.swf.yml`, `.workflow.yaml`) |
| `packages/ui/src/models/entities/base-entity.ts` | Add `SWFWorkflow = 'swfWorkflow'` to `EntityType` enum |
| `packages/ui/src/models/camel/camel-resource-factory.ts` | Add `SwfResourceFactory.getSwfResource()` check **before** the `CamelKResourceFactory` check |

---

## 6. TypeScript Type Definitions (`entities/Workflow.ts`)

```typescript
// Mirrors schema/workflow.yaml $defs — keep minimal for the POC

export interface SwfDocument {
  dsl: string;
  namespace: string;
  name: string;
  version: string;
  title?: string;
  summary?: string;
  tags?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/** A taskList item: exactly one key (the task name), value is the task definition */
export type SwfTaskItem = Record<string, SwfTaskDefinition>;

/** Union of all possible task definition shapes */
export type SwfTaskDefinition = SwfTaskBase & (
  | SwfCallTask
  | SwfDoTask
  | SwfForkTask
  | SwfForTask
  | SwfEmitTask
  | SwfListenTask
  | SwfRaiseTask
  | SwfRunTask
  | SwfSetTask
  | SwfSwitchTask
  | SwfTryTask
  | SwfWaitTask
);

/** Properties inherited by all tasks (taskBase in the schema) */
export interface SwfTaskBase {
  if?: string;
  input?: SwfInput;
  output?: SwfOutput;
  export?: SwfExport;
  timeout?: SwfTimeout | string;
  then?: SwfFlowDirective;
}

export type SwfFlowDirective = 'continue' | 'exit' | 'end' | string;

// ── Leaf tasks ────────────────────────────────────────────────────────────────

export interface SwfCallTask {
  call: 'http' | 'openapi' | 'grpc' | 'asyncapi' | string;
  with?: Record<string, unknown>;
}

export interface SwfSetTask {
  set: Record<string, unknown>;
}

export interface SwfRaiseTask {
  raise: { error: SwfError | string };
}

export interface SwfEmitTask {
  emit: { event: { with?: Record<string, unknown>; [key: string]: unknown } };
}

export interface SwfListenTask {
  listen: { to: SwfEventConsumptionStrategy };
}

export interface SwfWaitTask {
  wait: SwfDuration | { duration: SwfDuration };
}

export interface SwfRunTask {
  run: SwfRunContainer | SwfRunScript | SwfRunShell | SwfRunWorkflow;
}

// ── Container tasks ───────────────────────────────────────────────────────────

export interface SwfDoTask {
  do: SwfTaskItem[];
}

export interface SwfForkTask {
  fork: {
    branches: SwfTaskItem[];
    compete?: boolean;
  };
}

export interface SwfForTask {
  for: {
    each: string;
    in: string;
    at?: string;
  };
  while?: string;
  do: SwfTaskItem[];
}

export interface SwfSwitchCase {
  when?: string;
  then: SwfFlowDirective;
}

export interface SwfSwitchTask {
  switch: Array<Record<string, SwfSwitchCase>>;
}

export interface SwfTryTask {
  try: SwfTaskItem[];
  catch?: SwfCatchBlock[];
  finally?: SwfTaskItem[];
}

export interface SwfCatchBlock {
  errors?: { with?: SwfErrorFilter };
  as?: string;
  when?: string;
  retry?: SwfRetryPolicy | string;
  do?: SwfTaskItem[];
}

// ── Supporting types (abbreviated for POC) ───────────────────────────────────

export interface SwfDuration {
  days?: number; hours?: number; minutes?: number; seconds?: number; milliseconds?: number;
}

export interface SwfError {
  type: string;
  status?: number;
  instance?: string;
  title?: string;
  detail?: string;
}

export interface SwfErrorFilter {
  type?: string;
  status?: number;
}

export interface SwfEventConsumptionStrategy {
  one?: SwfEventFilter;
  any?: SwfEventFilter[];
  all?: SwfEventFilter[];
}

export interface SwfEventFilter {
  with?: Record<string, unknown>;
  correlate?: Record<string, string>;
}

export interface SwfInput { schema?: unknown; from?: string; }
export interface SwfOutput { schema?: unknown; as?: string; }
export interface SwfExport { schema?: unknown; as?: string; }
export interface SwfTimeout { after: SwfDuration | string; }
export interface SwfRetryPolicy { delay?: SwfDuration | string; backoff?: unknown; limit?: unknown; jitter?: unknown; }
export interface SwfRunContainer { container: Record<string, unknown>; }
export interface SwfRunScript { script: Record<string, unknown>; }
export interface SwfRunShell { shell: Record<string, unknown>; }
export interface SwfRunWorkflow { workflow: Record<string, unknown>; }

/** The top-level Workflow document */
export interface SwfWorkflow {
  document: SwfDocument;
  do: SwfTaskItem[];
  input?: SwfInput;
  output?: SwfOutput;
  use?: SwfUseBlock;
  timeout?: SwfTimeout | string;
  schedule?: SwfSchedule;
}

export interface SwfUseBlock {
  authentications?: Record<string, unknown>;
  errors?: Record<string, SwfError>;
  extensions?: unknown[];
  functions?: Record<string, SwfTaskDefinition>;
  retries?: Record<string, SwfRetryPolicy>;
  secrets?: string[];
  timeouts?: Record<string, SwfTimeout>;
  catalogs?: Record<string, unknown>;
}

export interface SwfSchedule {
  every?: SwfDuration | string;
  cron?: string;
  after?: SwfDuration | string;
  on?: SwfEventConsumptionStrategy;
}
```

---

## 7. Task Type Detection (`support/swf-task-utils.ts`)

```typescript
import { SwfTaskDefinition } from '../entities/Workflow';

export type SwfTaskKind =
  | 'call-http' | 'call-openapi' | 'call-grpc' | 'call-asyncapi' | 'call-custom'
  | 'do' | 'fork' | 'for' | 'emit' | 'listen' | 'raise' | 'run' | 'set' | 'switch' | 'try' | 'wait'
  | 'unknown';

export function getSwfTaskKind(task: SwfTaskDefinition): SwfTaskKind {
  if ('call' in task) {
    switch ((task as { call: string }).call) {
      case 'http':     return 'call-http';
      case 'openapi':  return 'call-openapi';
      case 'grpc':     return 'call-grpc';
      case 'asyncapi': return 'call-asyncapi';
      default:         return 'call-custom';
    }
  }
  if ('do'     in task) return 'do';
  if ('fork'   in task) return 'fork';
  if ('for'    in task) return 'for';
  if ('emit'   in task) return 'emit';
  if ('listen' in task) return 'listen';
  if ('raise'  in task) return 'raise';
  if ('run'    in task) return 'run';
  if ('set'    in task) return 'set';
  if ('switch' in task) return 'switch';
  if ('try'    in task) return 'try';
  if ('wait'   in task) return 'wait';
  return 'unknown';
}

/** Returns a human-readable label for the task kind */
export function getSwfTaskLabel(taskName: string, task: SwfTaskDefinition): string {
  const kind = getSwfTaskKind(task);
  const kindLabel: Record<SwfTaskKind, string> = {
    'call-http':    'HTTP Call',
    'call-openapi': 'OpenAPI Call',
    'call-grpc':    'gRPC Call',
    'call-asyncapi':'AsyncAPI Call',
    'call-custom':  'Function Call',
    'do':           'Do',
    'fork':         'Fork',
    'for':          'For',
    'emit':         'Emit',
    'listen':       'Listen',
    'raise':        'Raise',
    'run':          'Run',
    'set':          'Set',
    'switch':       'Switch',
    'try':          'Try',
    'wait':         'Wait',
    'unknown':      'Task',
  };
  return `${taskName} (${kindLabel[kind]})`;
}

/** True if this task kind contains nested taskLists */
export function isSwfContainerTask(task: SwfTaskDefinition): boolean {
  return 'do' in task || 'fork' in task || 'for' in task || 'switch' in task || 'try' in task;
}
```

---

## 8. Source Schema Type Detection

### `source-schema-type.ts` — additions

```typescript
// Add to SourceSchemaType enum:
SWF = 'SWF',

// Add to getResourceTypeFromPath(), BEFORE the generic .yaml catch-all:
} else if (
  path?.endsWith('.swf.yaml') ||
  path?.endsWith('.swf.yml') ||
  path?.endsWith('.workflow.yaml') ||
  path?.endsWith('.workflow.yml')
) {
  return SourceSchemaType.SWF;
```

### `base-entity.ts` — additions

```typescript
// Add to EntityType enum:
SWFWorkflow = 'swfWorkflow',
```

---

## 9. Type Guard and Resource Factory (`swf-resource-factory.ts`)

```typescript
import { SourceSchemaType } from '../camel/source-schema-type';
import { KaotoResource } from '../kaoto-resource';
import { SwfWorkflow } from './entities/Workflow';
import { SwfResource } from './swf-resource';

/**
 * Type guard: returns true when `json` has the shape of a Serverless Workflow document.
 * Uses duck-typing: checks for `document.dsl` and `do` array — no `actions` or `from` present.
 */
export function isSwfWorkflow(json: unknown): json is SwfWorkflow {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return false;
  const obj = json as Record<string, unknown>;
  return (
    typeof obj['document'] === 'object' &&
    obj['document'] !== null &&
    typeof (obj['document'] as Record<string, unknown>)['dsl'] === 'string' &&
    Array.isArray(obj['do'])
  );
}

export class SwfResourceFactory {
  static getSwfResource(json: unknown, type?: SourceSchemaType): KaotoResource | undefined {
    if (type === SourceSchemaType.SWF || isSwfWorkflow(json)) {
      return new SwfResource(json as SwfWorkflow);
    }
    return undefined;
  }
}
```

---

## 10. KaotoResource Implementation (`swf-resource.ts`)

```typescript
import { TileFilter } from '../../components/Catalog';
import { SourceSchemaType } from '../camel/source-schema-type';
import { BaseEntity, EntityType } from '../entities';
import {
  AddStepMode,
  BaseVisualEntityDefinition,
  BaseVisualEntityDefinitionItem,
  IVisualizationNodeData,
  KaotoResource,
  KaotoResourceSerializer,
  SerializerType,
} from '../kaoto-resource';
import { SwfWorkflow } from './entities/Workflow';
import { SwfVisualEntity } from './swf-visual-entity';

export class SwfResource implements KaotoResource {
  private visualEntities: SwfVisualEntity[] = [];

  constructor(private workflow: SwfWorkflow) {}

  initialize(): void {
    this.visualEntities = [new SwfVisualEntity(this.workflow)];
  }

  getVisualEntities(): SwfVisualEntity[] {
    return this.visualEntities;
  }

  getEntities(): BaseEntity[] {
    return [];          // No non-visual metadata entities for the POC
  }

  addNewEntity(): string {
    return '';          // Not supported in POC
  }

  removeEntity(): void {
    // Not supported in POC
  }

  supportsMultipleVisualEntities(): boolean {
    return false;       // One workflow = one visual entity
  }

  toJSON(): SwfWorkflow {
    return this.workflow;
  }

  toString(): string {
    // Delegate to YAML serializer
    return JSON.stringify(this.workflow, null, 2);
  }

  getType(): SourceSchemaType {
    return SourceSchemaType.SWF;
  }

  getCanvasEntityList(): BaseVisualEntityDefinition {
    const item: BaseVisualEntityDefinitionItem = {
      name: EntityType.SWFWorkflow,
      title: 'Serverless Workflow',
      description: 'A Serverless Workflow DSL 1.0.x document',
    };
    return { common: [item], groups: {} };
  }

  getSerializerType(): SerializerType {
    return SerializerType.YAML;
  }

  setSerializer(_serializer: SerializerType): void {
    // Single serializer for POC
  }

  getCompatibleComponents(
    _mode: AddStepMode,
    _data: IVisualizationNodeData,
  ): TileFilter | undefined {
    return undefined;   // No catalog integration in POC
  }

  getCompatibleRuntimes(): string[] {
    return ['Serverless Workflow'];
  }
}
```

---

## 11. Visual Entity (`swf-visual-entity.ts`)

This is the core of the POC. The `toVizNode()` method must recursively walk the `taskList` and produce an `IVisualizationNode` tree.

```typescript
import { getCamelRandomId } from '../../camel-utils/camel-random-id';
import { DefinedComponent } from '../camel/camel-catalog-index';
import { EntityType } from '../entities';
import { KaotoSchemaDefinition } from '../kaoto-schema';
import {
  AddStepMode,
  BaseVisualEntity,
  IVisualizationNode,
  IVisualizationNodeData,
  NodeInteraction,
} from '../visualization/base-visual-entity';
import { IClipboardCopyObject } from '../visualization/clipboard';
import { createVisualizationNode } from '../visualization/visualization-node';
import { SwfTaskDefinition, SwfTaskItem, SwfWorkflow } from './entities/Workflow';
import { getSwfTaskKind, getSwfTaskLabel, isSwfContainerTask } from './support/swf-task-utils';

export class SwfVisualEntity implements BaseVisualEntity {
  id: string;
  readonly type = EntityType.SWFWorkflow;

  constructor(public workflow: SwfWorkflow) {
    this.id = workflow?.document?.name ?? getCamelRandomId('swf');
  }

  static isApplicable(entity: unknown): entity is SwfWorkflow {
    return (
      typeof entity === 'object' &&
      entity !== null &&
      'document' in entity &&
      'do' in entity
    );
  }

  getRootPath(): string { return 'workflow'; }
  getId(): string { return this.id; }
  setId(id: string): void { this.id = id; this.workflow.document.name = id; }

  getNodeLabel(path?: string): string {
    if (!path || path === this.getRootPath()) return this.id;
    return path.split('.').pop() ?? path;
  }

  getNodeSchema(_path?: string): KaotoSchemaDefinition['schema'] | undefined {
    // Return undefined for POC — schema-driven form support is a follow-up
    return undefined;
  }

  getNodeDefinition(path?: string): unknown {
    if (!path || path === this.getRootPath()) return this.workflow;
    return undefined;
  }

  getOmitFormFields(): string[] { return []; }

  toJSON(): SwfWorkflow { return this.workflow; }

  updateModel(_path: string | undefined, _value: unknown): void { /* no-op for POC */ }

  addStep(_options: {
    definedComponent: DefinedComponent;
    mode: AddStepMode;
    data: IVisualizationNodeData;
  }): void { /* no-op for POC */ }

  getCopiedContent(_path?: string): IClipboardCopyObject | undefined { return undefined; }

  pasteStep(_options: {
    clipboardContent: IClipboardCopyObject;
    mode: AddStepMode;
    data: IVisualizationNodeData;
  }): void { /* no-op for POC */ }

  canDragNode(_path?: string): boolean { return false; }
  canDropOnNode(_path?: string): boolean { return false; }
  removeStep(_path?: string): void { /* no-op for POC */ }

  getNodeInteraction(_data: IVisualizationNodeData): NodeInteraction {
    return {
      canHavePreviousStep: false,
      canHaveNextStep: false,
      canHaveChildren: false,
      canHaveSpecialChildren: false,
      canReplaceStep: false,
      canRemoveStep: false,
      canRemoveFlow: false,
      canBeDisabled: false,
    };
  }

  getNodeValidationText(_path?: string): string | undefined { return undefined; }

  /**
   * Entry point: builds the full IVisualizationNode tree.
   *
   * Structure:
   *   root (workflow) → children = tasks in `do`
   *   each container task → children = its nested taskList(s)
   */
  async toVizNode(): Promise<IVisualizationNode> {
    const rootNode = createVisualizationNode(this.getRootPath(), {
      name: this.id,
      path: this.getRootPath(),
      entity: this,
      isPlaceholder: false,
      isGroup: true,
      iconUrl: '',
      title: `${this.workflow.document.name} (${this.workflow.document.version})`,
      description: this.workflow.document.title ?? '',
    });

    const taskNodes = this.buildTaskListNodes(this.workflow.do, this.getRootPath(), this);
    taskNodes.forEach((node) => rootNode.addChild(node));

    // Wire up prev/next within the sequential main flow
    for (let i = 0; i < taskNodes.length - 1; i++) {
      taskNodes[i].setNextNode(taskNodes[i + 1]);
      taskNodes[i + 1].setPreviousNode(taskNodes[i]);
    }

    return rootNode;
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private buildTaskListNodes(
    taskList: SwfTaskItem[],
    parentPath: string,
    entity: BaseVisualEntity,
  ): IVisualizationNode[] {
    return taskList.flatMap((taskItem, index) => {
      const [taskName, taskDef] = Object.entries(taskItem)[0];
      return this.buildTaskNode(taskName, taskDef, `${parentPath}.do.${index}`, entity);
    });
  }

  private buildTaskNode(
    taskName: string,
    taskDef: SwfTaskDefinition,
    path: string,
    entity: BaseVisualEntity,
  ): IVisualizationNode {
    const kind = getSwfTaskKind(taskDef);
    const isContainer = isSwfContainerTask(taskDef);

    const node = createVisualizationNode(path, {
      name: taskName,
      path,
      entity,
      isPlaceholder: false,
      isGroup: isContainer,
      iconUrl: '',
      title: getSwfTaskLabel(taskName, taskDef),
      description: kind,
      swfTaskKind: kind,
      swfThen: (taskDef as { then?: string }).then,
    });

    // ── Recurse into container tasks ──────────────────────────────────────────

    if ('do' in taskDef && Array.isArray((taskDef as { do: SwfTaskItem[] }).do)) {
      // DoTask or ForTask inner loop
      const children = this.buildTaskListNodes((taskDef as { do: SwfTaskItem[] }).do, path, entity);
      children.forEach((c) => node.addChild(c));
    }

    if ('fork' in taskDef) {
      const { fork } = taskDef as { fork: { branches: SwfTaskItem[]; compete?: boolean } };
      fork.branches.forEach((branchItem, bi) => {
        const [branchName, branchDef] = Object.entries(branchItem)[0];
        const branchNode = this.buildTaskNode(branchName, branchDef, `${path}.fork.branches.${bi}`, entity);
        node.addChild(branchNode);
      });
    }

    if ('switch' in taskDef) {
      const cases = (taskDef as { switch: Array<Record<string, unknown>> }).switch;
      cases.forEach((caseItem, ci) => {
        const [caseName, caseDef] = Object.entries(caseItem)[0];
        const caseNode = createVisualizationNode(`${path}.switch.${ci}`, {
          name: caseName,
          path: `${path}.switch.${ci}`,
          entity,
          isPlaceholder: false,
          isGroup: false,
          iconUrl: '',
          title: `${caseName} → ${(caseDef as { then?: string }).then ?? 'continue'}`,
          description: (caseDef as { when?: string }).when ?? '(default)',
          swfTaskKind: 'switch-case',
        });
        node.addChild(caseNode);
      });
    }

    if ('try' in taskDef) {
      const tryDef = taskDef as { try: SwfTaskItem[]; catch?: unknown[]; finally?: SwfTaskItem[] };

      // try body
      const tryChildren = this.buildTaskListNodes(tryDef.try, `${path}.try`, entity);
      tryChildren.forEach((c) => node.addChild(c));

      // catch blocks rendered as special children
      if (Array.isArray(tryDef.catch)) {
        tryDef.catch.forEach((_catchBlock, ci) => {
          const catchNode = createVisualizationNode(`${path}.catch.${ci}`, {
            name: `catch-${ci}`,
            path: `${path}.catch.${ci}`,
            entity,
            isPlaceholder: false,
            isGroup: false,
            iconUrl: '',
            title: `Catch (${ci})`,
            description: 'catch block',
            swfTaskKind: 'catch',
          });
          node.addChild(catchNode);
        });
      }
    }

    return node;
  }
}
```

---

## 12. Wiring into `CamelResourceFactory`

In [`packages/ui/src/models/camel/camel-resource-factory.ts`](../camel/camel-resource-factory.ts), add the SWF check **before** `CitrusTestResourceFactory`:

```typescript
// Add import:
import { SwfResourceFactory } from '../serverless-workflow/swf-resource-factory';

// Inside createCamelResource(), before the CitrusTestResourceFactory check:
const swfResource = SwfResourceFactory.getSwfResource(parsedCode, pathResourceType);
if (swfResource) {
  return swfResource;
}
```

---

## 13. Concrete YAML Examples (from the spec)

### Sequential tasks (`do-multiple`)
```yaml
document:
  dsl: '1.0.3'
  namespace: examples
  name: call-http-shorthand-endpoint
  version: '0.1.0'
do:
  - getPet:
      call: http
      with:
        method: get
        endpoint: https://petstore.swagger.io/v2/pet/{petId}
  - buyPet:
      call: http
      with:
        method: put
        endpoint: https://petstore.swagger.io/v2/pet/{petId}
        body: '${ . + { status: "sold" } }'
```
Expected canvas: `workflow` → `getPet (HTTP Call)` → `buyPet (HTTP Call)`

---

### Parallel branches (`fork`)
```yaml
document:
  dsl: '1.0.3'
  namespace: test
  name: fork-example
  version: '0.1.0'
do:
  - raiseAlarm:
      fork:
        compete: true
        branches:
          - callNurse:
              call: http
              with:
                method: put
                endpoint: https://fake-hospital.com/api/v3/alert/nurses
          - callDoctor:
              call: http
              with:
                method: put
                endpoint: https://fake-hospital.com/api/v3/alert/doctor
```
Expected canvas: `workflow` → `raiseAlarm (Fork)` ⤨ `callNurse (HTTP Call)` / `callDoctor (HTTP Call)`

---

### Conditional switch with explicit `then` jumps
```yaml
document:
  dsl: '1.0.3'
  namespace: test
  name: sample-workflow
  version: 0.1.0
do:
  - processOrder:
      switch:
        - case1:
            when: .orderType == "electronic"
            then: processElectronicOrder
        - case2:
            when: .orderType == "physical"
            then: processPhysicalOrder
        - default:
            then: handleUnknownOrderType
  - processElectronicOrder:
      set:
        validate: true
      then: exit
  - processPhysicalOrder:
      set:
        inventory: clear
      then: exit
  - handleUnknownOrderType:
      set:
        log: warn
```
Expected canvas: `processOrder (Switch)` with three case children, each pointing (via `then:`) to a sibling task node — these form DAG edges in addition to the sequential layout.

---

### Try/catch
```yaml
document:
  dsl: '1.0.3'
  namespace: default
  name: try-catch
  version: '0.1.0'
do:
  - tryGetPet:
      try:
        - getPet:
            call: http
            with:
              method: get
              endpoint: https://petstore.swagger.io/v2/pet/{petId}
      catch:
        errors:
          with:
            type: https://serverlessworkflow.io/spec/1.0.0/errors/communication
            status: 404
```
Expected canvas: `tryGetPet (Try)` → children: `getPet (HTTP Call)` + `catch-0 (Catch)`

---

## 14. Validation and Tests Required

Before the POC is considered complete, the following should pass:

### Unit tests

| Test file | What to verify |
|---|---|
| `swf-resource-factory.test.ts` | `isSwfWorkflow` returns true for valid SWF YAML, false for Camel/Citrus YAML |
| `swf-resource.test.ts` | `initialize()` creates one `SwfVisualEntity`; `toJSON()` round-trips |
| `swf-visual-entity.test.ts` | `toVizNode()` produces correct node tree for each example from §13 |
| `swf-task-utils.test.ts` | `getSwfTaskKind` returns correct kind for each discriminator key |
| `source-schema-type.test.ts` | `.swf.yaml` and `.workflow.yaml` paths resolve to `SourceSchemaType.SWF` |

### Integration smoke test

Load one of the example files from `/home/ricmarti/repos/serverlessworkflow-spec/examples/` via `CamelResourceFactory.createCamelResource(source, { path: 'x.swf.yaml' })` and assert that:
1. The returned resource is an `SwfResource` instance.
2. `getVisualEntities()` returns a non-empty array.
3. `toVizNode()` resolves without throwing.

### Lint / type-check

```bash
yarn workspace @kaoto/kaoto lint
yarn workspace @kaoto/kaoto test
```

---

## 15. Out of Scope for the POC

The following are intentionally deferred to follow-up PRs:

- **Schema-driven property forms** — `getNodeSchema()` returns `undefined`; a `SwfSchemaService` is needed to extract per-task schema fragments from `workflow.yaml`
- **Add/remove/replace task** — `addStep`, `removeStep`, `pasteStep` are no-ops
- **Drag-and-drop** — `canDragNode` / `canDropOnNode` return `false`
- **DAG edge rendering** — `then:` jump edges are stored in node data (`swfThen`) but not rendered as canvas arrows; requires a canvas-level feature
- **Catalog integration** — `getCompatibleComponents` returns `undefined`; no SWF task catalog is defined
- **Serialization back to YAML** — `toString()` uses `JSON.stringify` as a placeholder; a proper YAML serializer is needed
- **`use.*` reusable components** — functions, retries, catalogs are not visualized
- **XML SWF** — out of scope; spec is YAML-only in practice
