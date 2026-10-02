describe('Selected form during an external source refresh', () => {
  it('keeps the form open while the selected step changes', () => {
    cy.openHomePage();
    cy.uploadFixture('flows/camelRoute/basic.yaml');
    cy.openDesignPage();
    cy.showAllRoutes();
    cy.openStepConfigurationTab('setHeader');
    let closeButton: HTMLElement;
    cy.get('[data-testid="close-side-bar"]').then(($button) => {
      closeButton = $button[0] as HTMLElement;
    });

    cy.fixture('flows/camelRoute/basic.yaml').then((source: string) => {
      const updated = source.replace('constant: test', 'constant: changed');
      expect(updated).not.to.equal(source);
      cy.window().then((win) => {
        const importNotifier = win.eval('import("/src/utils/event-notifier.ts")') as Promise<{
          EventNotifier: { getInstance: () => { next: (event: string, value: unknown) => void } };
        }>;
        return importNotifier.then(({ EventNotifier }) => {
          EventNotifier.getInstance().next('code:updated', { code: updated });
        });
      });
    });

    cy.contains('changed').should('exist');
    cy.then(() => expect(closeButton.isConnected).to.equal(true));
  });
});
