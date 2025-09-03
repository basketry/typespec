import { expectDefined, parse } from '../test-utils.js';

describe('4.1.33 HTTP Parameter', () => {
  describe('kind', () => {
    it.todo('parses "HttpParameter"');
  });

  describe('pattern', () => {
    it.only('works', async () => {
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
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const http = service?.interfaces[0].protocols?.http;
      expectDefined(http);
    });
  });
});
