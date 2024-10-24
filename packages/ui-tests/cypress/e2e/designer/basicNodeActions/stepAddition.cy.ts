describe('Tests for Design page', () => {
  beforeEach(() => {
    cy.openHomePage();
  });

  it('Design - add steps to CamelRoute', () => {
    cy.uploadFixture('flows/camelRoute/basic.yaml');
    cy.openDesignPage();

    cy.selectAppendNode('setHeader');
    cy.chooseFromCatalog('component', 'as2');
    cy.checkNodeExist('as2', 1);

    cy.selectPrependNode('setHeader');
    cy.chooseFromCatalog('processor', 'log');
    cy.checkNodeExist('log', 2);

    cy.openSourceCode();
    cy.checkCodeSpanLine('uri: as2', 1);
    cy.checkCodeSpanLine('log', 1);
  });

  it('Design - add steps to Pipe/KB', () => {
    cy.uploadFixture('flows/kameletBinding/kafkaSourceSink.yaml');
    cy.openDesignPage();

    cy.selectAppendNode('json-deserialize-action');
    cy.chooseFromCatalog('kamelet', 'log-action');
    cy.checkNodeExist('log-action', 1);

    cy.selectPrependNode('json-deserialize-action');
    cy.chooseFromCatalog('kamelet', 'string-template-action');
    cy.checkNodeExist('string-template-action', 1);

    cy.openSourceCode();
    cy.checkCodeSpanLine('log-action', 1);
    cy.checkCodeSpanLine('string-template-action', 1);
  });

  it('Design - add steps to CamelRoute using the quick append icon', () => {
    cy.uploadFixture('flows/camelRoute/basic.yaml');
    cy.openDesignPage();

    cy.quickAppend();
    cy.chooseFromCatalog('processor', 'choice');

    cy.quickAppend();
    cy.chooseFromCatalog('component', 'as2');

    cy.quickAppend(1);
    cy.chooseFromCatalog('component', 'amqp');

    cy.openSourceCode();
    cy.checkCodeSpanLine('choice:', 1);
    cy.checkCodeSpanLine('uri: amqp', 1);
    cy.checkCodeSpanLine('uri: as2', 1);
  });
});
