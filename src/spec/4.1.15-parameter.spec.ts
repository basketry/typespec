import {
  expectComplex,
  expectDefined,
  expectPrimitive,
  parse,
} from './test-utils.js';

describe('4.1.8 Method', () => {
  describe('kind', () => {
    it('parses "Parameter"', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          get(id: string): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const param = service?.interfaces[0]?.methods[0]?.parameters[0];
      expectDefined(param);
      expect(param.kind).toBe('Parameter');
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
          get(id: string): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const param = service?.interfaces[0]?.methods[0]?.parameters[0];
      expectDefined(param);
      expect(param.name.value).toBe('id');
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
          get(id: string): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const param = service?.interfaces[0]?.methods[0]?.parameters[0];
      expectDefined(param);
      expect(param.description).toBeUndefined();
    });

    it('parses a single comment', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          get(
            /** Description of the id parameter */
            id: string,
          ): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const param = service?.interfaces[0]?.methods[0]?.parameters[0];
      expectDefined(param);
      const description = param.description?.[0];
      expectDefined(description);
      expect(description.value).toBe('Description of the id parameter');
      expect(description.loc).toBeDefined();
    });

    it('parses multiple comments', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          get(
            /** Description of the id parameter */
            /** Another description */
            id: string,
          ): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const param = service?.interfaces[0]?.methods[0]?.parameters[0];
      expectDefined(param);

      const a = param.description?.[0];
      expectDefined(a);
      expect(a.value).toBe('Description of the id parameter');
      expect(a.loc).toBeDefined();

      const b = param.description?.[1];
      expectDefined(b);
      expect(b.value).toBe('Another description');
      expect(b.loc).toBeDefined();
    });
  });

  describe('value', () => {
    it('parses a primitive type', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          get(id: string): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const param = service?.interfaces[0]?.methods[0]?.parameters[0];
      expectDefined(param);
      expectPrimitive(param.value);
      expect(param.value.typeName.value).toBe('string');
    });

    it('parses a referenced complex type', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        model Widget {
          id: string;
          name: string;
        }

        interface Widgets {
          create(widget: Widget): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const param = service?.interfaces[0]?.methods[0]?.parameters[0];
      expectDefined(param);
      expectComplex(param.value);
      expect(param.value.typeName.value).toBe('Widget');
    });

    it('parses an inline complex type', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          create(widget: { id: string; name: string; }): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const param = service?.interfaces[0]?.methods[0]?.parameters[0];
      expectDefined(param);
      expectComplex(param.value);
      expect(param.value.typeName.value).toBe('widgetsCreateWidget');

      const type = service?.types.find(
        (t) => t.name.value === 'widgetsCreateWidget',
      );
      expectDefined(type);
    });

    it('parses an inline union', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        model Widget {
          id: string;
          name: string;
        }

        model Gizmo {
          id: string;
          description: string;
        }

        interface Widgets {
          create(item: Widget | Gizmo): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const param = service?.interfaces[0]?.methods[0]?.parameters[0];
      expectDefined(param);
      expectComplex(param.value);
      expect(param.value.typeName.value).toBe('widgetsCreateItem');

      const union = service?.unions.find(
        (t) => t.name.value === 'widgetsCreateItem',
      );
      expectDefined(union);
    });

    it('parses a proxied type', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        model Widget {
          id: string;
          name: string;
        }

        interface Widgets {
          get(id: Widget.id): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const param = service?.interfaces[0]?.methods[0]?.parameters[0];
      expectDefined(param);
      expectPrimitive(param.value);
      expect(param.value.typeName.value).toBe('string');
    });
  });
});
