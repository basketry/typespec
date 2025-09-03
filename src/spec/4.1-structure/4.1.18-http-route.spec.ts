import { expectDefined, parse } from '../test-utils.js';

describe('4.1.18 HTTP Route', () => {
  describe('kind', () => {
    it('parses "HttpRoute"', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        using Http;
        @service
        namespace Petstore;

        @route("/widgets")
        interface Widgets {
          @get list(): string;
        }
      `;

      // ACT
      const { service } = await parse(tsp);

      // ASSERT
      const httpRoute = service?.interfaces[0].protocols?.http?.[0];
      expectDefined(httpRoute);
      expect(httpRoute.kind).toEqual('HttpRoute');
    });
  });

  describe('pattern', () => {
    it('parses from the interface', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        using Http;
        @service
        namespace Petstore;

        @route("/widgets")
        interface Widgets {
          @get list(): string;
        }
      `;

      // ACT
      const { service } = await parse(tsp);

      // ASSERT
      const httpRoute = service?.interfaces[0].protocols?.http?.[0];
      expectDefined(httpRoute);
      expect(httpRoute.pattern.value).toEqual('/widgets');
    });

    it('parses from the interface and route param', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        using Http;
        @service
        namespace Petstore;

        @route("/widgets")
        interface Widgets {
          @get read(@path id: string): string;
        }
      `;

      // ACT
      const { service } = await parse(tsp);

      // ASSERT
      const httpRoute = service?.interfaces[0].protocols?.http?.[0];
      expectDefined(httpRoute);
      expect(httpRoute.pattern.value).toEqual('/widgets/{id}');
    });

    it('parses from the interface and operation decorator', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        using Http;
        @service
        namespace Petstore;

        @route("/widgets")
        interface Widgets {
          @route("{id}/analyze") @post analyze(@path id: string): string;
        }
      `;

      // ACT
      const { service } = await parse(tsp);

      // ASSERT
      const httpRoute = service?.interfaces[0].protocols?.http?.[0];
      expectDefined(httpRoute);
      expect(httpRoute.pattern.value).toEqual('/widgets/{id}/analyze');
    });
  });
});
