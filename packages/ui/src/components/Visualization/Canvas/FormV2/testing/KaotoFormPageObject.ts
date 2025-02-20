import { fireEvent, Screen } from '@testing-library/dom';
import { isDefined } from '../../../../../utils';

export class KaotoFormPageObject {
  constructor(
    private readonly screen: Screen,
    private readonly executor: (callback: () => Promise<void>) => Promise<void>,
  ) {}

  async showRequiredFields(): Promise<void> {
    const [requiredTab] = this.screen.getAllByRole('button', { name: 'Required' });
    await this.executor(async () => {
      fireEvent.click(requiredTab);
    });
  }

  async showAllFields(): Promise<void> {
    const [allTab] = this.screen.getAllByRole('button', { name: 'All' });
    await this.executor(async () => {
      fireEvent.click(allTab);
    });
  }

  async showModifiedFields(): Promise<void> {
    const [modifiedTab] = this.screen.getAllByRole('button', { name: 'Modified' });
    await this.executor(async () => {
      fireEvent.click(modifiedTab);
    });
  }

  getExpressionInputForProperty(propertyName: string): HTMLElement | null {
    return this.screen.queryByTestId(`${propertyName}__expression-list-typeahead-select-input`);
  }

  getOneOfInputForProperty(propertyName: string): HTMLElement | null {
    return this.screen.queryByTestId(`${propertyName}__oneof-list-typeahead-select-input`);
  }

  getSetObjectButtonForProperty(propertyName: string): HTMLElement | null {
    return this.screen.queryByTestId(`${propertyName}__set`);
  }

  getRemoveObjectButtonForProperty(propertyName: string): HTMLElement | null {
    return this.screen.queryByTestId(`${propertyName}__remove`);
  }

  getFormField(name: string): HTMLElement | null {
    return this.screen.queryByRole('textbox', { name });
  }

  async selectTypeaheadItem(propertyName: string, itemName: string): Promise<void> {
    const expressionItem = this.screen.queryByRole('option', { name: `option ${itemName}` });
    if (!isDefined(expressionItem)) {
      throw new Error(`Expression item for property "${propertyName}" not found.`);
    }

    await this.executor(async () => {
      fireEvent.click(expressionItem);
    });
  }

  async inputText(propertyName: string, text: string): Promise<void> {
    const inputField = this.getFormField(propertyName);
    if (!isDefined(inputField)) {
      throw new Error(`Input field for property "${propertyName}" not found.`);
    }

    await this.executor(async () => {
      fireEvent.input(inputField, { target: { value: text } });
    });
  }

  async toggleExpressionFieldForProperty(propertyName: string): Promise<void> {
    const expressionField = this.getExpressionInputForProperty(propertyName);
    if (!isDefined(expressionField)) {
      throw new Error(`Expression field for property "${propertyName}" not found.`);
    }

    await this.executor(async () => {
      fireEvent.click(expressionField);
    });
  }

  async toggleOneOfFieldForProperty(propertyName: string): Promise<void> {
    const oneOfField = this.getOneOfInputForProperty(propertyName);
    if (!isDefined(oneOfField)) {
      throw new Error(`OneOf field for property "${propertyName}" not found.`);
    }

    await this.executor(async () => {
      fireEvent.click(oneOfField);
    });
  }

  async setObjectForProperty(propertyName: string): Promise<void> {
    const setObjectButton = this.getSetObjectButtonForProperty(propertyName);
    if (!isDefined(setObjectButton)) {
      throw new Error(`SetObject button for property "${propertyName}" not found.`);
    }

    await this.executor(async () => {
      fireEvent.click(setObjectButton);
    });
  }
}
