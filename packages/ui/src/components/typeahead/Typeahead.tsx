import {
  Button,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
} from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons';
import {
  FormEvent,
  FunctionComponent,
  MouseEventHandler,
  Ref,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { isDefined } from '../../utils';
import { TypeaheadProps } from './Typeahead.types';

export const CREATE_NEW_VALUE = 'create-new';
export const CREATE_NEW_WITH_NAME_VALUE = 'create-new-with-name';

const DEFAULT_POPPER_PROPS = {
  position: 'end',
  preventOverflow: true,
} as const;

export const Typeahead: FunctionComponent<TypeaheadProps> = ({
  selectedItem,
  items: itemsProps,
  id,
  placeholder = 'Select or write an option',
  onChange,
  onCleanInput,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
  onCreate,
  onCreatePrefix,
}) => {
  const [inputValue, setInputValue] = useState<string>(selectedItem?.name ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(() => {
    const localArray = itemsProps.slice();
    if (isDefined(onCreate)) {
      localArray.push({ name: `Create new ${onCreatePrefix}`, description: '', value: CREATE_NEW_VALUE });
    }
    const isValueInArray = isDefined(itemsProps.find((item) => item.name === selectedItem?.name));
    if (isValueInArray) {
      return localArray;
    }
    if (selectedItem?.name && selectedItem?.value) {
      localArray.unshift({ name: selectedItem.name, value: selectedItem.value });
    }
    return localArray;
  }, [itemsProps, onCreate, onCreatePrefix, selectedItem?.name, selectedItem?.value]);

  useEffect(() => {
    if (selectedItem?.name) {
      setInputValue(selectedItem.name);
    }
  }, [selectedItem]);

  const onItemChanged = useCallback(
    (_event: unknown, name: string | number | undefined) => {
      if (name === CREATE_NEW_VALUE || name === CREATE_NEW_WITH_NAME_VALUE) {
        onCreate?.(name, inputValue);
        setIsOpen(false);
        return;
      } else if (!isDefined(name)) {
        onChange?.(undefined);
        setInputValue('');
        setIsOpen(false);
        return;
      }

      const localItem = items.find((item) => item.value === name);
      setInputValue(localItem?.name ?? '');
      setIsOpen(false);

      if (name !== selectedItem?.name) {
        onChange?.(localItem);
      }
    },
    [onChange, items, selectedItem?.name, onCreate, inputValue],
  );

  const onToggleClick: MouseEventHandler<HTMLDivElement | HTMLButtonElement> = (event) => {
    event.stopPropagation();
    setIsOpen(!isOpen);
  };

  const onTextInputChange = (_event: FormEvent<HTMLInputElement>, value: string) => {
    setInputValue(value);
  };

  const onTextInputClear = () => {
    setInputValue('');
    onCleanInput?.();
    inputRef.current?.focus();
  };

  const filteredItems = useMemo(() => {
    const lowerFilterValue = inputValue.toLowerCase();
    return items.filter((item) => {
      if (!lowerFilterValue) {
        return true;
      }

      const hasNameMatch = item.name?.toLowerCase().includes(lowerFilterValue);
      const hasDescriptionMatch = item.description?.toLowerCase().includes(lowerFilterValue);

      return hasNameMatch || hasDescriptionMatch;
    });
  }, [inputValue, items]);

  const toggle = (toggleRef: Ref<MenuToggleElement>) => (
    <MenuToggle
      isFullWidth
      ref={toggleRef}
      onClick={onToggleClick}
      isExpanded={isOpen}
      variant="typeahead"
      aria-label={`${ariaLabel} toggle`}
      id={id}
    >
      <TextInputGroup isPlain>
        <TextInputGroupMain
          autoComplete="off"
          id={`${id}-typeahead-select-input`}
          aria-label={ariaLabel}
          data-testid={`${dataTestId}-typeahead-select-input`}
          ref={inputRef}
          placeholder={placeholder}
          onClick={onToggleClick}
          value={inputValue}
          onChange={onTextInputChange}
        />

        <TextInputGroupUtilities>
          {!!inputValue && (
            <Button
              variant="plain"
              onClick={onTextInputClear}
              aria-label="Clear input value"
              data-testid={`${dataTestId}__clear`}
              icon={<TimesIcon aria-hidden />}
            />
          )}
        </TextInputGroupUtilities>
      </TextInputGroup>
    </MenuToggle>
  );

  return (
    <Select
      id={`${id}-typeahead-select`}
      data-testid={`${dataTestId}-typeahead-select`}
      isScrollable
      shouldFocusToggleOnSelect
      isOpen={isOpen}
      selected={selectedItem?.name}
      onSelect={onItemChanged}
      toggle={toggle}
      onOpenChange={(isOpen) => setIsOpen(isOpen)}
      popperProps={DEFAULT_POPPER_PROPS}
    >
      <SelectList>
        {filteredItems.map((item) => (
          <SelectOption
            key={item.name}
            value={item.value}
            description={item.description}
            aria-label={`option ${item.name.toLocaleLowerCase()}`}
          >
            {item.name}
          </SelectOption>
        ))}

        {filteredItems.length === 0 && onCreate && (
          <SelectOption
            value={CREATE_NEW_WITH_NAME_VALUE}
            aria-label={`option ${CREATE_NEW_WITH_NAME_VALUE.toLocaleLowerCase()}`}
          >
            Create new {onCreatePrefix} &quot;{inputValue}&quot;
          </SelectOption>
        )}
        {filteredItems.length === 0 && !onCreate && <SelectOption isDisabled>No items found</SelectOption>}
      </SelectList>
    </Select>
  );
};
