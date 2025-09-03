import { expectDefined, parse } from './test-utils.js';

describe('4.1.8 Method', () => {
  describe('kind', () => {
    it('parses "Method"', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          get(): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const method = service?.interfaces[0]?.methods[0];
      expectDefined(method);
      expect(method.kind).toBe('Method');
    });
  });

  describe('name', () => {
    it('parses the name', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          get(): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const method = service?.interfaces[0]?.methods[0];
      expectDefined(method);
      expect(method.name.value).toBe('get');
    });
  });

  describe('decription', () => {
    it('is undefined when no comment is present', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          get(): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const method = service?.interfaces[0]?.methods[0];
      expectDefined(method);
      expect(method.description).toBeUndefined();
    });

    it('parses a single comment', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          /** Description of the get method */
          get(): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const method = service?.interfaces[0]?.methods[0];
      expectDefined(method);
      const description = method.description?.[0];
      expectDefined(description);
      expect(description.value).toBe('Description of the get method');
      expect(description.loc).toBeDefined();
    });

    it('parses multiple comments', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          /** Description of the get method */
          /** Another description */
          get(): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const method = service?.interfaces[0]?.methods[0];
      expectDefined(method);

      const a = method.description?.[0];
      expectDefined(a);
      expect(a.value).toBe('Description of the get method');
      expect(a.loc).toBeDefined();

      const b = method.description?.[1];
      expectDefined(b);
      expect(b.value).toBe('Another description');
      expect(b.loc).toBeDefined();
    });
  });

  describe('returns', () => {
    it('is undefined when the return type is void', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          get(): void;
        }
      `;

      // ACT
      const { service } = await parse(tsp);

      // ASSERT
      const method = service?.interfaces[0]?.methods[0];
      expectDefined(method);

      expect(method.returns).toBeUndefined();
    });
  });
});
