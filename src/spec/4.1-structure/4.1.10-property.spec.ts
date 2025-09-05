import { expectDefined, parse } from '../test-utils.js';

describe('4.1.10 Property', () => {
  describe('kind', () => {
    it('parses "Property"', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        model Widget {
          id: string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const method = service?.types[0]?.properties[0];
      expectDefined(method);
      expect(method.kind).toBe('Property');
    });
  });
});
