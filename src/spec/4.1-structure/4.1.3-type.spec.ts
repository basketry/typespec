import {
  expectComplex,
  expectDefined,
  expectPrimitive,
  parse,
} from '../test-utils.js';

describe('4.1.3 Type', () => {
  describe('kind', () => {
    it('parses "Type"', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        model Widget {
          id: string;
          name: string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const type = service?.types[0];
      expectDefined(type);
      expect(type.kind).toBe('Type');
    });
  });

  describe('name', () => {
    it('parses an explicit name', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        model Widget {
          id: string;
          name: string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const type = service?.types[0];
      expectDefined(type);
      expect(type.name.value).toBe('Widget');
    });

    it('parses an implicit name for child types', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        model Widget {
          id: string;
          name: {
            first: string;
            last: string;
          };
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);

      const type = service?.types.find((t) => t.name.value === 'widgetName');
      expectDefined(type);
    });

    it('parses an implicit name for return types', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          get(id: string): {
            id: string;
            name: string;
          };
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);

      const type = service?.types[0];
      expectDefined(type);
      expect(type.name.value).toBe('getWidgetsResponse');
    });

    it('parses an implicit name for parameters', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          create(widget: {id: string; name: string;}): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);

      const type = service?.types[0];
      expectDefined(type);
      expect(type.name.value).toBe('createWidgetsWidget');
    });
  });

  describe('description', () => {
    it('parses an description from a model', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        /** A widget */
        model Widget {
          id: string;
          name: string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const description = service?.types[0]?.description?.[0];
      expectDefined(description);
      expect(description.value).toBe('A widget');
    });
  });

  describe('mapProperties', () => {
    it('parses from the "is" operator', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        model Gizmo {
          id: string;
          name: string;
        }

        model Widget is Record<Gizmo>;
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const mapProperties = service?.types.find(
        (t) => t.name.value === 'Widget',
      )?.mapProperties;
      expectDefined(mapProperties);

      expectPrimitive(mapProperties.key.value);
      expectComplex(mapProperties.value.value);

      expect(mapProperties.key.value.typeName.value).toBe('string');
      expect(mapProperties.value.value.typeName.value).toBe('Gizmo');
    });

    it.todo('parses from the "extends" operator');
  });
});
