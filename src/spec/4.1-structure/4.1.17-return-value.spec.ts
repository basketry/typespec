import {
  expectComplex,
  expectDefined,
  expectPrimitive,
  parse,
} from '../test-utils.js';

describe('4.1.17 ReturnValue', () => {
  describe('kind', () => {
    it('parses "ReturnValue"', async () => {
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
      const returns = service?.interfaces[0]?.methods[0].returns;
      expectDefined(returns);
      expect(returns.kind).toBe('ReturnValue');
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
          get(): string;
        }
      `;

      // ACT
      const { service } = await parse(tsp);

      // ASSERT
      const returns = service?.interfaces[0]?.methods[0].returns;
      expectDefined(returns);
      expectPrimitive(returns.value);

      expect(returns.value.typeName.value).toEqual('string');
    });

    it('parses an inline complex type', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          get(): { id: string; name: string };
        }
      `;

      // ACT
      const { service } = await parse(tsp);

      // ASSERT
      const returns = service?.interfaces[0]?.methods[0].returns;
      const types = service?.types;
      expectDefined(returns);
      expectDefined(types);
      expectComplex(returns.value);

      expect(returns.value.typeName.value).toEqual('getWidgetsResponse');

      const responseType = types.find(
        (t) => t.name.value === 'getWidgetsResponse',
      );
      expectDefined(responseType);
    });

    it('parses an referenced complex type', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        model WidgetResponse {
          id: string;
          name: string;
        }

        interface Widgets {
          get(): WidgetResponse;
        }
      `;

      // ACT
      const { service } = await parse(tsp);

      // ASSERT
      const returns = service?.interfaces[0]?.methods[0].returns;
      const types = service?.types;
      expectDefined(returns);
      expectDefined(types);
      expectComplex(returns.value);

      expect(returns.value.typeName.value).toEqual('WidgetResponse');

      const responseType = types.find((t) => t.name.value === 'WidgetResponse');
      expectDefined(responseType);
    });

    it('parses an inline union', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        model WidgetResponse {
          id: string;
          name: string;
        }

        model Error {
          message: string;
          code: number;
        }

        interface Widgets {
          get(): WidgetResponse | Error;
        }
      `;

      // ACT
      const { service } = await parse(tsp);

      // ASSERT
      const returns = service?.interfaces[0]?.methods[0].returns;
      const unions = service?.unions;
      expectDefined(returns);
      expectDefined(unions);
      expectComplex(returns.value);

      expect(returns.value.typeName.value).toEqual('getWidgetsResponse');

      const responseUnion = unions.find(
        (t) => t.name.value === 'getWidgetsResponse',
      );
      expectDefined(responseUnion);
    });

    it('parses a response with a status code', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        using Http;
        @service
        namespace Petstore;

        @route("/widgets")
        interface Widgets {
          @get get(): {
            @statusCode statusCode: 204;
            @body _: string;
          };
        }
      `;

      // ACT
      const { service } = await parse(tsp);

      // ASSERT
      const returns = service?.interfaces[0]?.methods[0].returns;
      const unions = service?.unions;
      expectDefined(returns);
      expectDefined(unions);
      expectPrimitive(returns.value);

      expect(returns.value.typeName.value).toEqual('string');
    });
  });
});
