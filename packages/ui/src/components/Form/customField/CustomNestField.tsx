/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Card, CardBody, CardHeader, CardTitle } from '@patternfly/react-core';
import { useContext } from 'react';
import { HTMLFieldProps, connectField, filterDOMProps } from 'uniforms';
import { FilteredFieldContext } from '../../../providers';
import { getFieldGroups, getFilteredProperties } from '../../../utils';
import { CustomAutoField } from '../CustomAutoField';
import { CustomExpandableSection } from './CustomExpandableSection';
import './CustomNestField.scss';
import { KaotoSchemaDefinition } from '../../../models';

export type CustomNestFieldProps = HTMLFieldProps<
  object,
  HTMLDivElement,
  {
    properties?: Record<string, unknown>;
    helperText?: string;
    itemProps?: object;
  }
>;

export const CustomNestField = connectField(
  ({
    children,
    error,
    errorMessage,
    fields,
    itemProps,
    label,
    name,
    showInlineError,
    disabled,
    ...props
  }: CustomNestFieldProps) => {
    const { filteredFieldText, isGroupExpanded } = useContext(FilteredFieldContext);
    const cleanQueryTerm = filteredFieldText.replace(/\s/g, '').toLowerCase();
    const filteredProperties = getFilteredProperties(
      props.properties as KaotoSchemaDefinition['schema']['properties'],
      cleanQueryTerm,
    );
    const propertiesArray = getFieldGroups(filteredProperties);
    if (propertiesArray.common.length === 0 && Object.keys(propertiesArray.groups).length === 0) return null;

    return (
      <Card className="custom-nest-field" data-testid="nest-field" {...filterDOMProps(props)}>
        <CardHeader>
          <CardTitle>{label}</CardTitle>
        </CardHeader>
        <CardBody>
          {propertiesArray.common.map((field) => (
            <CustomAutoField key={field} name={field} />
          ))}
        </CardBody>

        {Object.entries(propertiesArray.groups)
          .sort((a, b) => (a[0] === 'advanced' ? 1 : b[0] === 'advanced' ? -1 : 0))
          .map(([groupName, groupFields]) => (
            <CustomExpandableSection
              key={`${groupName}-section-toggle`}
              groupName={groupName}
              isGroupExpanded={isGroupExpanded}
            >
              <CardBody>
                {groupFields.map((field) => (
                  <CustomAutoField key={field} name={field} />
                ))}
              </CardBody>
            </CustomExpandableSection>
          ))}
      </Card>
    );
  },
);
