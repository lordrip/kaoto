import { Button, Checkbox, Popover, Text, TextVariants } from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons';
import { FieldProps } from '@rjsf/utils';

export const BooleanField = (props: FieldProps) => {
  const { id, name, schema, formData, required, onChange } = props;

  return (
    <>
      <Checkbox
        id={id ?? name}
        name={name}
        label={schema.title}
        isChecked={formData}
        onChange={(_event, value) => onChange(value)}
        isRequired={required}
      />
      <Popover
        bodyContent={schema.description}
        footerContent={
          <Text component={TextVariants.small}>Default: {schema.default?.toString() ?? <i>No default value</i>}</Text>
        }
        triggerAction="hover"
        withFocusTrap={false}
      >
        <Button variant="plain" icon={<HelpIcon />} aria-label={`More info for ${id} field`} aria-describedby={id} />
      </Popover>
    </>
  );
};
