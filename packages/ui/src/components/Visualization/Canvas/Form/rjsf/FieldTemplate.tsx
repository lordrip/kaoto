import { Button, FormGroup, Popover, Text, TextVariants } from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons';
import { FieldTemplateProps } from '@rjsf/utils';

export const FieldTemplate = (props: FieldTemplateProps) => {
  const { id, label, children, required } = props;

  /** Avoid rendering the wrapping around Object or Boolean properties */
  if (props.schema.type === 'object' || props.schema.type === 'boolean') {
    return <>{children}</>;
  }

  return (
    <FormGroup
      label={label}
      labelIcon={
        <Popover
          bodyContent={props.rawDescription}
          footerContent={
            <Text component={TextVariants.small}>
              Default: {props.schema.default?.toString() ?? <i>No default value</i>}
            </Text>
          }
          triggerAction="hover"
          withFocusTrap={false}
        >
          <Button variant="plain" icon={<HelpIcon />} aria-label={`More info for ${id} field`} aria-describedby={id} />
        </Popover>
      }
      isRequired={required}
      fieldId={id}
    >
      {children}
    </FormGroup>
  );
};
