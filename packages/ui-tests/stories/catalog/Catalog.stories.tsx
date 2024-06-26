import { Catalog, ITile } from '@kaoto/kaoto';
import { Meta, StoryFn } from '@storybook/react';
import catalog from '../../cypress/fixtures/catalog-slim.json';

export default {
  title: 'Catalog/Catalog',
  component: Catalog,
} as Meta<typeof Catalog>;

const Template: StoryFn<typeof Catalog> = (args) => {
  return <Catalog {...args} />;
};

export const CatalogWithSearch = Template.bind({});
CatalogWithSearch.args = {
  tiles: catalog as ITile[],
  onTileClick: () => null,
};
