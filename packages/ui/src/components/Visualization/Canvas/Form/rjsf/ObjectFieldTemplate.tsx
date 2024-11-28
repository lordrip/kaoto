import { Card, CardBody, CardTitle } from '@patternfly/react-core';
import { ObjectFieldTemplateProps } from '@rjsf/utils';
import { Fragment } from 'react';

export const ObjectFieldTemplate = (props: ObjectFieldTemplateProps) => {
  const { title } = props;

  return (
    <Card ouiaId="BasicCard">
      {title && <CardTitle>{title}</CardTitle>}

      <CardBody>
        {props.properties.map((element) => (
          <Fragment key={element.content.key}>{element.content}</Fragment>
        ))}
      </CardBody>
    </Card>
  );
};
