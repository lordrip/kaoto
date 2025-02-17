import { FormGroup, FormGroupLabelHelp, Popover } from '@patternfly/react-core';
import { FunctionComponent, PropsWithChildren, ReactNode } from 'react';
import { FieldProps } from '../typings';

interface FieldWrapperProps extends FieldProps {
  type: string;
  title?: ReactNode;
  description?: string;
  defaultValue?: string;
}

export const FieldWrapper: FunctionComponent<PropsWithChildren<FieldWrapperProps>> = ({
  propName,
  required,
  title,
  type,
  description,
  defaultValue = 'no default value',
  children,
}) => {
  const id = `${propName}-popover`;
  const label = title ?? propName.split('.').pop();

  return (
    <FormGroup
      data-testid={`${propName}__field-wrapper`}
      fieldId={propName}
      label={label}
      isRequired={required}
      labelHelp={
        <Popover
          id={id}
          headerContent={
            <p className="kaoto-form__label">
              {label} {`<${type}>`}
            </p>
          }
          bodyContent={<p>{description}</p>}
          footerContent={<p>Default: {defaultValue}</p>}
          triggerAction="hover"
          withFocusTrap={false}
        >
          <FormGroupLabelHelp aria-label={`More info for ${label} field`} />
        </Popover>
      }
    >
      {children}
    </FormGroup>
  );
};
