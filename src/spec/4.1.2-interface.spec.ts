import { expectDefined, parse } from './test-utils.js';

describe('4.1.2 Interface', () => {
  describe('kind', () => {
    it('parses "Interface"', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {}
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      expectDefined(service);
      expect(service.interfaces[0].kind).toBe('Interface');
    });
  });
});
