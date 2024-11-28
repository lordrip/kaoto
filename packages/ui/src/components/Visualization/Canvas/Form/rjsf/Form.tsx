import { ThemeProps, withTheme } from '@rjsf/core';
import { RegistryFieldsType, TemplatesType } from '@rjsf/utils';
import { BooleanField } from './BooleanField';
import { DescriptionFieldTemplate } from './DescriptionFieldTemplate';
import { FieldTemplate } from './FieldTemplate';
import { ObjectFieldTemplate } from './ObjectFieldTemplate';
import { StringField } from './StringField';
import { ComponentProps, FunctionComponent } from 'react';

const customFields: RegistryFieldsType = {
  StringField,
  BooleanField,
};

const customTemplates: Partial<TemplatesType> = {
  DescriptionFieldTemplate,
  FieldTemplate,
  ObjectFieldTemplate,
};

const themeObject: ThemeProps = { fields: customFields, templates: customTemplates };
const ThemedForm = withTheme(themeObject);

interface CustomFormProps extends ComponentProps<typeof ThemedForm> {
  omitFields?: string[];
}

export const CustomForm: FunctionComponent<CustomFormProps> = (props) => {
  const { schema, omitFields = [] } = props;

  const cleanSchema = {
    ...schema,
    properties: Object.keys(schema.properties ?? {})
      .filter((key) => !omitFields.includes(key))
      .reduce(
        (acc, key) => {
          acc![key] = schema.properties![key];
          return acc;
        },
        {} as (typeof schema)['properties'],
      ),
  };

  return <ThemedForm {...props} schema={cleanSchema} />;
};
