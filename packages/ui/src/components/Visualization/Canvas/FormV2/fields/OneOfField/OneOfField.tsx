import { FunctionComponent, useContext, useMemo, useState } from 'react';
import { isDefined } from '../../../../../../utils';
import { getAppliedSchemaIndexV2 } from '../../../../../../utils/get-applied-schema-index';
import { getOneOfSchemaListV2, OneOfSchemas } from '../../../../../../utils/get-oneof-schema-list';
import { useFieldValue } from '../../hooks/field-value';
import { SchemaContext, SchemaProvider } from '../../providers/SchemaProvider';
import { FieldProps } from '../../typings';
import { AutoField } from '../AutoField';
import { SchemaList } from './SchemaList';

export const OneOfField: FunctionComponent<FieldProps> = ({ propName }) => {
  const { schema, definitions } = useContext(SchemaContext);
  const { value, onChange } = useFieldValue<unknown>(propName);

  const oneOfSchemas: OneOfSchemas[] = useMemo(
    () => getOneOfSchemaListV2(schema.oneOf ?? [], definitions),
    [definitions, schema.oneOf],
  );
  const appliedSchemaIndex = getAppliedSchemaIndexV2(value, oneOfSchemas, definitions);
  const presetSchema = appliedSchemaIndex === -1 ? undefined : oneOfSchemas[appliedSchemaIndex];
  const [selectedOneOfSchema, setSelectedOneOfSchema] = useState<OneOfSchemas | undefined>(presetSchema);

  const onSchemaChange = (schema?: OneOfSchemas) => {
    if (schema?.name === selectedOneOfSchema?.name) {
      return;
    }

    if (typeof value === 'object' && isDefined(selectedOneOfSchema?.schema.properties)) {
      const newValue = { ...value };
      Object.keys(selectedOneOfSchema.schema.properties).forEach((prop) => {
        delete (newValue as Record<string, unknown>)[prop];
      });
      onChange(newValue);
    }

    setSelectedOneOfSchema(schema);
  };

  return (
    <SchemaList
      propName={propName}
      selectedSchema={selectedOneOfSchema}
      schemas={oneOfSchemas}
      onChange={onSchemaChange}
    >
      {selectedOneOfSchema && (
        <SchemaProvider schema={selectedOneOfSchema.schema}>
          <AutoField propName={propName} />
        </SchemaProvider>
      )}
    </SchemaList>
  );
};
