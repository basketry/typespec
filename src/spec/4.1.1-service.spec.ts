import { expectDefined, parse } from './test-utils.js';

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
    it.todo('parses the service title if present');
  });
  describe('majorVersion', () => {
    it.todo('parses the major version if present');
    it.todo('parses as 1 if not present');
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
