import { ErrorHandler } from '@kaoto/camel-catalog/types';
import { errorHandlerSchema } from '../stubs/error-handler';
import { getAppliedSchemaIndex } from './get-applied-schema-index';
import { getOneOfSchemaList } from './get-oneof-schema-list';

describe('getAppliedSchemaIndex', () => {
  it('should return the index of the applied oneOf schema for a given model', () => {
    const model: ErrorHandler = {
      springTransactionErrorHandler: {
        id: 'springTransactionErrorHandler',
        logName: 'springTransactionErrorHandler',
        useOriginalBody: true,
      },
    };

    const result = getAppliedSchemaIndex(model, getOneOfSchemaList(errorHandlerSchema.oneOf!), errorHandlerSchema);

    expect(result).toBe(5);
  });

  it('should return the index of the applied oneOf schema for a given model when a missing required property', () => {
    const model: ErrorHandler = {
      deadLetterChannel: {
        deadLetterHandleNewException: true,
      },
      springTransactionErrorHandler: undefined,
    };

    const result = getAppliedSchemaIndex(model, getOneOfSchemaList(errorHandlerSchema.oneOf!), errorHandlerSchema);

    expect(result).toBe(0);
  });
});
