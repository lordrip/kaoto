import { act, renderHook } from '@testing-library/react';
import { CamelResource } from '../models/camel';
import { CamelRouteVisualEntity } from '../models/visualization/flows';
import { camelRouteJson, camelRouteYaml } from '../stubs/camel-route';
import { camelRouteYaml_1_1_original, camelRouteYaml_1_1_updated } from '../stubs/camel-route-yaml-1.1';
import { EventNotifier } from '../utils';
import { useEntities } from './entities';

describe('useEntities', () => {
  let eventNotifier: EventNotifier;
  beforeEach(() => {
    eventNotifier = EventNotifier.getInstance();
  });

  it('it should subscribe to the `code:updated` notification', () => {
    const notifierSpy = jest.spyOn(eventNotifier, 'subscribe');

    renderHook(() => useEntities());

    expect(notifierSpy).toHaveBeenCalledWith('code:updated', expect.anything());
  });

  it('updating the source code should NOT recreate the Camel Resource', () => {
    const { result } = renderHook(() => useEntities());

    act(() => {
      const firstCamelResource = result.current.camelResource;
      result.current.updateSourceCodeFromEntities();
      const secondCamelResource = result.current.camelResource;

      expect(firstCamelResource).toBe(secondCamelResource);
    });
  });

  it('should recreate the entities when the source code is updated', () => {
    const { result } = renderHook(() => useEntities());

    act(() => {
      eventNotifier.next('code:updated', { code: camelRouteYaml });
    });

    expect(result.current.entities).toEqual([]);
    expect(result.current.visualEntities).toEqual([new CamelRouteVisualEntity(camelRouteJson)]);
  });

  it('should serialize using YAML 1.1', () => {
    const notifierSpy = jest.spyOn(eventNotifier, 'next');
    const { result } = renderHook(() => useEntities());

    act(() => {
      eventNotifier.next('code:updated', { code: camelRouteYaml_1_1_original });
    });

    act(() => {
      result.current.visualEntities[0].updateModel('route.from.parameters.bindingMode', 'off');
      result.current.updateSourceCodeFromEntities();
    });

    expect(notifierSpy).toHaveBeenCalledWith('entities:updated', camelRouteYaml_1_1_updated);
  });

  it('should notify subscribers when the entities are updated', () => {
    const notifierSpy = jest.spyOn(eventNotifier, 'next');
    const { result } = renderHook(() => useEntities());

    act(() => {
      result.current.camelResource.addNewEntity();
      result.current.updateSourceCodeFromEntities();
    });

    expect(notifierSpy).toHaveBeenCalledWith(
      'entities:updated',
      `- route:
    id: route-1234
    from:
      id: from-1234
      uri: timer
      parameters:
        period: "1000"
        timerName: template
      steps:
        - log:
            id: log-1234
            message: \${body}
`,
    );
  });

  it('updating entities should NOT recreate the Camel Resource', () => {
    let firstCamelResource: CamelResource;
    let secondCamelResource: CamelResource;

    const { result } = renderHook(() => useEntities());

    act(() => {
      firstCamelResource = result.current.camelResource;
      result.current.updateEntitiesFromCamelResource();
    });

    act(() => {
      secondCamelResource = result.current.camelResource;
      expect(firstCamelResource).toBe(secondCamelResource);
    });
  });

  it('should refresh entities', () => {
    const { result } = renderHook(() => useEntities());

    act(() => {
      result.current.camelResource.addNewEntity();
      result.current.camelResource.addNewEntity();
      result.current.updateEntitiesFromCamelResource();
    });

    expect(result.current.entities).toEqual([]);
    expect(result.current.visualEntities).toHaveLength(2);
  });

  it('should refresh entities and notify subscribers', () => {
    const notifierSpy = jest.spyOn(eventNotifier, 'next');
    const { result } = renderHook(() => useEntities());

    act(() => {
      result.current.updateEntitiesFromCamelResource();
    });

    expect(notifierSpy).toHaveBeenCalledWith(
      'entities:updated',
      `[]
`,
    );
  });

  it(`should store code's comments`, () => {
    const code = `# This is a comment
      # An indented comment

- route:
    id: route-1234
    from:
      id: from-1234
      uri: timer
      parameters:
        period: "1000"
        timerName: template
      # This comment won't be stored
      steps:
        - log:
            id: log-1234
            message: \${body}
`;

    const { result } = renderHook(() => useEntities());

    act(() => {
      eventNotifier.next('code:updated', { code });
    });

    expect(result.current.camelResource.toString()).toContain(
      `# This is a comment
      # An indented comment`,
    );
  });
});
