/**
 * Creates a web implementation of the KogitoEditorEnvelopeContextType.
 *
 * In VS Code, this context communicates via postMessage across an iframe boundary.
 * Here, we provide the same interface with direct in-memory method calls -
 * this is exactly what the multiplying architecture is designed for.
 */
import { KaotoEditorChannelApi } from '@kaoto/kaoto';
import { EditorTheme } from '@kie-tools-core/editor/dist/api';
import type { KogitoEditorEnvelopeContextType } from '@kie-tools-core/editor/dist/api';
import type { MessageBusClientApi } from '@kie-tools-core/envelope-bus/dist/api';

import { WebEditorChannelApi } from './WebEditorChannelApi';

/**
 * Creates a no-op NotificationConsumer.
 * Subscribers are tracked and called when send() is invoked.
 */
function createNotificationConsumer() {
  const subscribers = new Set<(...args: unknown[]) => void>();

  return {
    subscribe(callback: (...args: unknown[]) => void) {
      subscribers.add(callback);
      return callback;
    },
    unsubscribe(subscription: (...args: unknown[]) => void) {
      subscribers.delete(subscription);
    },
    send(...args: unknown[]) {
      subscribers.forEach((cb) => cb(...args));
    },
  };
}

/**
 * Creates a SharedValueConsumer with a default value.
 */
function createSharedValueConsumer<T>(defaultValue: T) {
  let currentValue = defaultValue;
  const subscribers = new Set<(newValue: T) => void>();

  return {
    subscribe(callback: (newValue: T) => void) {
      subscribers.add(callback);
      return callback;
    },
    unsubscribe(subscription: (newValue: T) => void) {
      subscribers.delete(subscription);
    },
    set(value: T) {
      currentValue = value;
      subscribers.forEach((cb) => cb(currentValue));
    },
  };
}

export interface WebEnvelopeContextOptions {
  /** Callback invoked when the editor signals it is ready */
  onReady?: () => void;
  /** Callback invoked when the editor produces a new edit */
  onNewEdit?: (edit: unknown) => void;
}

export function createWebEnvelopeContext(
  options: WebEnvelopeContextOptions = {},
): KogitoEditorEnvelopeContextType<KaotoEditorChannelApi> {
  const channelApi = new WebEditorChannelApi();

  // Build notification consumers
  const readyConsumer = createNotificationConsumer();
  if (options.onReady) {
    readyConsumer.subscribe(options.onReady);
  }

  const newEditConsumer = createNotificationConsumer();
  if (options.onNewEdit) {
    newEditConsumer.subscribe(options.onNewEdit);
  }

  const notifications = {
    kogitoEditor_ready: readyConsumer,
    kogitoEditor_setContentError: createNotificationConsumer(),
    kogitoEditor_stateControlCommandUpdate: createNotificationConsumer(),
    kogitoWorkspace_newEdit: newEditConsumer,
    kogitoWorkspace_openFile: createNotificationConsumer(),
    kogitoNotifications_createNotification: createNotificationConsumer(),
    kogitoNotifications_setNotifications: createNotificationConsumer(),
    kogitoNotifications_removeNotifications: createNotificationConsumer(),
  };

  const shared = {
    kogitoEditor_theme: createSharedValueConsumer(EditorTheme.LIGHT),
  };

  const noOpKeyboardShortcutsService = {
    registerKeyDownThenUp: () => -1,
    registerKeyPress: () => -1,
    registerKeyPressOnce: () => -1,
    deregister: () => {},
    registered: () => [],
    isEnabled: () => false,
  };

  const noOpI18nService = {
    executeOnLocaleChangeSubscriptions: () => {},
    subscribeToLocaleChange: (cb: (locale: string) => void) => cb,
    unsubscribeToLocaleChange: () => {},
  };

  const messageBusClientApi = {
    requests: channelApi,
    notifications,
    shared,
  } as unknown as MessageBusClientApi<KaotoEditorChannelApi>;

  return {
    channelApi: messageBusClientApi,
    operatingSystem: undefined,
    services: {
      keyboardShortcuts: noOpKeyboardShortcutsService,
      i18n: noOpI18nService,
    },
    supportedThemes: [EditorTheme.LIGHT, EditorTheme.DARK],
  } as unknown as KogitoEditorEnvelopeContextType<KaotoEditorChannelApi>;
}
