import { TextInput } from '@patternfly/react-core';
import { FieldProps } from '@rjsf/utils';

export const StringField = (props: FieldProps) => {
  return (
    <TextInput
      id={props.name}
      name={props.name}
      type="text"
      value={props.formData}
      placeholder={props.schema.default?.toString()}
      required={props.required}
      onChange={(_event, value) => props.onChange(value)}
    />
  );
};
