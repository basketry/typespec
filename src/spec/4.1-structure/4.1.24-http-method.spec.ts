import { expectDefined, parse } from '../test-utils.js';

describe('4.1.24 HTTP Method', () => {
  describe('kind', () => {
    it('parses "HttpMethod"', async () => {
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
      const httpMethod =
        service?.interfaces[0].protocols?.http?.[0].methods?.[0];
      expectDefined(httpMethod);
      expect(httpMethod.kind).toEqual('HttpMethod');
    });
  });

  describe('name', () => {
    it('parses the name', async () => {
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
      const httpMethod =
        service?.interfaces[0].protocols?.http?.[0].methods?.[0];
      expectDefined(httpMethod);
      expect(httpMethod.name.value).toEqual('list');
    });
  });

  describe('verb', () => {
    it('defaults to "get" if no verb or parameters are specified', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        using Http;
        @service
        namespace Petstore;

        @route("/widgets")
        interface Widgets {
          list(): string;
        }
      `;

      // ACT
      const { service } = await parse(tsp);

      // ASSERT
      const httpMethod =
        service?.interfaces[0].protocols?.http?.[0].methods?.[0];
      expectDefined(httpMethod);
      expect(httpMethod.verb.value).toEqual('get');
    });

    it('defaults to "post" if no verb is specified but a parameter is', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        using Http;
        @service
        namespace Petstore;

        @route("/widgets")
        interface Widgets {
          list(id: string): string;
        }
      `;

      // ACT
      const { service } = await parse(tsp);

      // ASSERT
      const httpMethod =
        service?.interfaces[0].protocols?.http?.[0].methods?.[0];
      expectDefined(httpMethod);
      expect(httpMethod.verb.value).toEqual('post');
    });

    it('parses a @get operation', async () => {
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
      const httpMethod =
        service?.interfaces[0].protocols?.http?.[0].methods?.[0];
      expectDefined(httpMethod);
      expect(httpMethod.verb.value).toEqual('get');
    });

    it('parses a @put operation', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        using Http;
        @service
        namespace Petstore;

        @route("/widgets")
        interface Widgets {
          @put list(): string;
        }
      `;

      // ACT
      const { service } = await parse(tsp);

      // ASSERT
      const httpMethod =
        service?.interfaces[0].protocols?.http?.[0].methods?.[0];
      expectDefined(httpMethod);
      expect(httpMethod.verb.value).toEqual('put');
    });

    it('parses a @post operation', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        using Http;
        @service
        namespace Petstore;

        @route("/widgets")
        interface Widgets {
          @post list(): string;
        }
      `;

      // ACT
      const { service } = await parse(tsp);

      // ASSERT
      const httpMethod =
        service?.interfaces[0].protocols?.http?.[0].methods?.[0];
      expectDefined(httpMethod);
      expect(httpMethod.verb.value).toEqual('post');
    });

    it('parses a @patch operation', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        using Http;
        @service
        namespace Petstore;

        @route("/widgets")
        interface Widgets {
          @patch list(): string;
        }
      `;

      // ACT
      const { service } = await parse(tsp);

      // ASSERT
      const httpMethod =
        service?.interfaces[0].protocols?.http?.[0].methods?.[0];
      expectDefined(httpMethod);
      expect(httpMethod.verb.value).toEqual('patch');
    });

    it('parses a @delete operation', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        using Http;
        @service
        namespace Petstore;

        @route("/widgets")
        interface Widgets {
          @delete list(): string;
        }
      `;

      // ACT
      const { service } = await parse(tsp);

      // ASSERT
      const httpMethod =
        service?.interfaces[0].protocols?.http?.[0].methods?.[0];
      expectDefined(httpMethod);
      expect(httpMethod.verb.value).toEqual('delete');
    });

    it('parses a @head operation', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        using Http;
        @service
        namespace Petstore;

        @route("/widgets")
        interface Widgets {
          @head list(): string;
        }
      `;

      // ACT
      const { service } = await parse(tsp);

      // ASSERT
      const httpMethod =
        service?.interfaces[0].protocols?.http?.[0].methods?.[0];
      expectDefined(httpMethod);
      expect(httpMethod.verb.value).toEqual('head');
    });
  });

  describe('successCode', () => {
    it('defaults to 200 if no @statusCode is defined', async () => {
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
      const httpMethod =
        service?.interfaces[0].protocols?.http?.[0].methods?.[0];
      expectDefined(httpMethod);
      expect(httpMethod.successCode.value).toEqual(200);
    });

    it('parses a @statusCode when only one is supplied', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        using Http;
        @service
        namespace Petstore;

        @route("/widgets")
        interface Widgets {
          @get list(): {
            @statusCode statusCode: 204;
            body: string;
          };
        }
      `;

      // ACT
      const { service } = await parse(tsp);

      // ASSERT
      const httpMethod =
        service?.interfaces[0].protocols?.http?.[0].methods?.[0];
      expectDefined(httpMethod);
      expect(httpMethod.successCode.value).toEqual(204);
    });

    it('parses the largest sub-300 @statusCode when multiple are supplied', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        using Http;
        @service
        namespace Petstore;

        @route("/widgets")
        interface Widgets {
          @get list(): {
            @statusCode statusCode: 204;
          } | {
            @statusCode statusCode: 206;
            body: string;
          } | {
            @statusCode statusCode: 404;
            body: string;
          }
        }
      `;

      // ACT
      const { service } = await parse(tsp);

      // ASSERT
      const httpMethod =
        service?.interfaces[0].protocols?.http?.[0].methods?.[0];
      expectDefined(httpMethod);
      expect(httpMethod.successCode.value).toEqual(206);
    });
  });
});
