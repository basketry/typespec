import { expectDefined, parse } from '../test-utils.js';

describe('4.1.1 Service', () => {
  describe('kind', () => {
    it('parses "Service"', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      expectDefined(service);
      expect(service.kind).toBe('Service');
    });
  });
  describe('basketry', () => {
    it('parses "0.2"', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      expectDefined(service);
      expect(service.basketry).toBe('0.2');
    });
  });
  describe('title', () => {
    it('parses the namespace name by default', async () => {
      // ARRANGE
      const tsp = `
      import "@typespec/http";

      @service
      namespace Petstore;
    `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      expectDefined(service);
      expect(service.title.value).toBe('Petstore');
      expect(service.title.loc).toBeDefined();
    });
    it('parses the service title if present', async () => {
      // ARRANGE
      const tsp = `
      import "@typespec/http";

      @service(#{ title: "Petstore API" })
      namespace Petstore;
    `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      expectDefined(service);
      expect(service.title.value).toBe('Petstore API');
      expect(service.title.loc).toBeDefined();
    });
  });
  describe('majorVersion', () => {
    it.todo('parses the major version if present');
    it('parses as 1 if not present', async () => {
      // ARRANGE
      const tsp = `
      import "@typespec/http";

      namespace Petstore;
    `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      expectDefined(service);
      expect(service.majorVersion.value).toBe(1);
    });
  });
  describe('sourcePaths', () => {
    it.todo('includes the source path');
  });
  describe('meta', () => {
    it.todo('parses meta data');
  });
  describe('loc', () => {
    it.todo('encodes the service location');
  });
});
