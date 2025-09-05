import { expectDefined, parse } from '../test-utils.js';

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
      const int = service?.interfaces[0];
      expectDefined(int);
      expect(int.kind).toBe('Interface');
    });
  });

  describe('name', () => {
    it('parses interface name as singular', async () => {
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
      const int = service?.interfaces[0];
      expectDefined(int);
      expect(int.name.value).toBe('Widget');
      expect(int.name.loc).toBeDefined();
    });
  });

  describe('description', () => {
    it('is undefined when no comment is present', async () => {
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
      const int = service?.interfaces[0];
      expectDefined(int);
      expect(int.description).toBeUndefined();
    });

    it('parses a single comment', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        /** Description of the Widgets interface */
        interface Widgets {}
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const int = service?.interfaces[0];
      expectDefined(int);
      const description = int.description?.[0];
      expectDefined(description);
      expect(description.value).toBe('Description of the Widgets interface');
      expect(description.loc).toBeDefined();
    });

    it('parses multiple comments', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        /** Description of the Widgets interface */
        /** Another description */
        interface Widgets {}
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const int = service?.interfaces[0];
      expectDefined(int);
      const a = int.description?.[0];

      expectDefined(a);
      expect(a.value).toBe('Description of the Widgets interface');
      expect(a.loc).toBeDefined();

      const b = int.description?.[1];
      expectDefined(b);
      expect(b.value).toBe('Another description');
      expect(b.loc).toBeDefined();
    });
  });
});
