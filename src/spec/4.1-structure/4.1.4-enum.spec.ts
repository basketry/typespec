import { expectDefined, parse } from '../test-utils.js';

describe('4.1.4 Enum', () => {
  it.todo('parses enums from operations');
  it('parses orphan enums (not referenced by operations)', async () => {
    // ARRANGE
    const tsp = `
      import "@typespec/http";

      @service
      namespace Petstore;

      /** Pet status in the store */
      enum PetStatus {
        /** Available pet */
        available,
        pending,
        sold,
      }
    `;

    // ACT
    const { service, violations } = await parse(tsp);

    // ASSERT
    expect(violations).toHaveLength(0);
    const e = service?.enums[0];
    expectDefined(e);
  });
});
