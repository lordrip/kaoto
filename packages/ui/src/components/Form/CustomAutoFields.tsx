import { AutoField } from '@kaoto-next/uniforms-patternfly';
import { Card, CardBody } from '@patternfly/react-core';
import { ComponentType, createElement, useContext } from 'react';
import { useForm } from 'uniforms';
import { CatalogKind, KaotoSchemaDefinition } from '../../models';
import { CanvasFormTabsContext, FilteredFieldContext } from '../../providers';
import { getFieldGroups, getFilteredProperties, isDefined } from '../../utils';
import './CustomAutoFields.scss';
import { CustomExpandableSection } from './customField/CustomExpandableSection';
import { NoFieldFound } from './NoFieldFound';

export type AutoFieldsProps = {
  autoField?: ComponentType<{ name: string }>;
  element?: ComponentType | string;
  fields?: string[];
  omitFields?: string[];
};

export function CustomAutoFields({
  autoField = AutoField,
  element = 'div',
  fields,
  omitFields = [],
  ...props
}: AutoFieldsProps) {
  const { schema } = useForm();
  const rootField = schema.getField('');
  const { filteredFieldText, isGroupExpanded } = useContext(FilteredFieldContext);
  const canvasFormTabsContext = useContext(CanvasFormTabsContext);
  const cleanQueryTerm = filteredFieldText.replace(/\s/g, '').toLowerCase();
  const schemaObject = isDefined(fields)
    ? fields.reduce((acc: { [name: string]: unknown }, name) => {
        acc[name] = schema.getField(name);
        return acc;
      }, {})
    : (rootField as KaotoSchemaDefinition['schema']).properties;

  const filteredProperties = getFilteredProperties(
    schemaObject as KaotoSchemaDefinition['schema']['properties'],
    cleanQueryTerm,
    omitFields,
  );
  const propertiesArray = getFieldGroups(filteredProperties);

  if (
    canvasFormTabsContext?.selectedTab !== 'All' &&
    propertiesArray.common.length === 0 &&
    Object.keys(propertiesArray.groups).length === 0
  ) {
    const comment = (rootField as KaotoSchemaDefinition['schema'])['$comment'] ?? '';
    if (!comment.includes('expression') && !comment.includes('dataformat') && !comment.includes('loadbalance')) {
      return <NoFieldFound />;
    }
  }

  return createElement(
    element,
    props,
    <>
      {propertiesArray.common.map((field) => (
        <AutoField key={field} name={field} />
      ))}

      {Object.entries(propertiesArray.groups).map(([groupName, groupFields]) => (
        <CustomExpandableSection
          key={`${CatalogKind.Processor}-${groupName}-section-toggle`}
          groupName={CatalogKind.Processor + ' ' + groupName}
          isGroupExpanded={isGroupExpanded}
        >
          <Card className="nest-field-card">
            <CardBody className="nest-field-card-body">
              {groupFields.map((field) => (
                <AutoField key={field} name={field} />
              ))}
            </CardBody>
          </Card>
        </CustomExpandableSection>
      ))}
    </>,
  );
}
