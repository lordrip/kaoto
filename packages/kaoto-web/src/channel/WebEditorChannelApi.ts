/**
 * Web implementation of the KaotoEditorChannelApi.
 *
 * Provides in-memory implementations of the channel API methods
 * that the Kaoto editor calls back into the host for settings,
 * metadata, file operations, etc.
 *
 * Note: We avoid `implements KaotoEditorChannelApi` because the
 * @kie-tools-core sub-packages bundle duplicate type declarations
 * that cause structural type conflicts. The type safety is enforced
 * at the point of use in createWebEnvelopeContext instead.
 */
import { EditorTheme } from '@kie-tools-core/editor/dist/api';
import { SettingsModel } from '@kaoto/kaoto/models';

const CATALOG_URL = './camel-catalog/index.json';

export class WebEditorChannelApi {
  private metadata: Map<string, unknown> = new Map();

  // -- KaotoEditorChannelApi methods --

  async getCatalogURL(): Promise<string | undefined> {
    return CATALOG_URL;
  }

  async getVSCodeKaotoSettings() {
    return new SettingsModel({ catalogUrl: CATALOG_URL });
  }

  async getMetadata<T>(key: string): Promise<T | undefined> {
    return this.metadata.get(key) as T | undefined;
  }

  async setMetadata<T>(key: string, value: T): Promise<void> {
    this.metadata.set(key, value);
  }

  async getResourcesContentByType(): Promise<[]> {
    return [];
  }

  async getResourceContent(): Promise<string | undefined> {
    return undefined;
  }

  async saveResourceContent(): Promise<void> {
    // no-op for MVP
  }

  async deleteResource(): Promise<boolean> {
    return false;
  }

  async askUserForFileSelection(): Promise<string[] | string | undefined> {
    return undefined;
  }

  async getSuggestions(): Promise<[]> {
    return [];
  }

  async getRuntimeInfoFromMavenContext(): Promise<undefined> {
    return undefined;
  }

  async onStepUpdated(): Promise<void> {
    // no-op
  }

  // -- KogitoEditorChannelApi methods --

  kogitoEditor_ready(): void {
    // handled via notification consumer
  }

  kogitoEditor_setContentError(): void {
    // no-op
  }

  kogitoEditor_stateControlCommandUpdate(): void {
    // no-op
  }

  async kogitoEditor_contentRequest() {
    return { content: '', normalizedPosixPathRelativeToTheWorkspaceRoot: '' };
  }

  kogitoEditor_theme() {
    return { defaultValue: EditorTheme.LIGHT };
  }

  // -- I18nChannelApi --

  async kogitoI18n_getLocale(): Promise<string> {
    return navigator.language;
  }

  // -- WorkspaceChannelApi --

  kogitoWorkspace_newEdit(): void {
    // handled via notification consumer
  }

  kogitoWorkspace_openFile(): void {
    // no-op
  }

  async kogitoWorkspace_resourceContentRequest() {
    return undefined;
  }

  async kogitoWorkspace_resourceListRequest() {
    return { pattern: '', paths: [], normalizedPosixPathsRelativeToTheWorkspaceRoot: [] };
  }

  // -- NotificationsChannelApi --

  kogitoNotifications_createNotification(): void {
    // no-op
  }

  kogitoNotifications_setNotifications(): void {
    // no-op
  }

  kogitoNotifications_removeNotifications(): void {
    // no-op
  }
}
