import { Form } from '@patternfly/react-core';
import { FunctionComponent, useCallback, useState } from 'react';
import { KaotoSchemaDefinition } from '../../../../models';
import { isDefined, ROOT_PATH, setValue } from '../../../../utils';
import { AutoField } from './fields/AutoField';
import './KaotoForm.scss';
import { FormComponentFactoryProvider } from './providers/FormComponentFactoryProvider';
import { ModelContextProvider } from './providers/ModelProvider';
import { SchemaDefinitionsProvider } from './providers/SchemaDefinitionsProvider';
import { SchemaProvider } from './providers/SchemaProvider';
import { NoFieldFound } from '../../../Form/NoFieldFound';

export interface FormProps {
  schema?: KaotoSchemaDefinition['schema'];
  onChange: (propName: string, value: unknown) => void;
  model: unknown;
  omitFields?: string[];
}

export const KaotoForm: FunctionComponent<FormProps> = ({ schema, onChange, model, omitFields = [] }) => {
  const [formModel, setFormModel] = useState<unknown>(model);

  const onPropertyChange = useCallback(
    (propName: string, value: unknown) => {
      console.log('KaotoForm.onPropertyChange', propName, value);

      onChange(propName, value);
      setFormModel((prevModel: unknown) => {
        if (typeof prevModel !== 'object') {
          return value;
        }

        const newModel = { ...prevModel };
        setValue(newModel, propName, value);
        return newModel;
      });
    },
    [onChange],
  );

  if (!isDefined(schema)) {
    return <div>Schema not defined</div>;
  }

  return (
    <FormComponentFactoryProvider>
      <SchemaDefinitionsProvider schema={schema} omitFields={omitFields}>
        <SchemaProvider schema={schema}>
          <ModelContextProvider model={formModel} onPropertyChange={onPropertyChange}>
            <Form className="kaoto-form kaoto-form__label">
              <AutoField propName={ROOT_PATH} />
            </Form>
            <NoFieldFound className="kaoto-form kaoto-form__empty" />
          </ModelContextProvider>
        </SchemaProvider>
      </SchemaDefinitionsProvider>
    </FormComponentFactoryProvider>
  );
};
