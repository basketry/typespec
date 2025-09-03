import { Primitive } from '@basketry/ir';
import { expectDefined, expectPrimitive, parse } from './test-utils.js';

describe('4.1.13 PrimitiveValue', () => {
  describe('kind', () => {
    it('parses "PrimitiveValue"', async () => {
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
      const memberValue =
        service?.interfaces[0]?.methods[0]?.parameters[0]?.value;
      expectDefined(memberValue);
      expect(memberValue.kind).toBe('PrimitiveValue');
    });
  });

  describe('value', () => {
    const cases: [string, Primitive][] = [
      // Integers
      ['integer', 'integer'],
      ['int8', 'integer'],
      ['int16', 'integer'],
      ['int32', 'integer'],
      ['safeint', 'integer'],
      ['int64', 'long'],
      ['uint8', 'integer'],
      ['uint16', 'integer'],
      ['uint32', 'integer'],
      ['uint64', 'long'],

      // Floating point numbers
      ['float', 'float'],
      ['float32', 'float'],
      ['float64', 'double'],

      // decimal
      ['decimal', 'number'],
      ['decimal128', 'number'],

      // numeric
      ['numeric', 'number'],

      // other scalars
      ['string', 'string'],
      ['boolean', 'boolean'],
      ['null', 'null'],
      ['bytes', 'binary'],
      ['plainDate', 'date'],
      ['utcDateTime', 'date-time'],

      // Unsupported
      ['offsetDateTime', 'untyped'],
      ['plainTime', 'untyped'],
      ['duration', 'untyped'],
    ];

    it.each(cases)(
      'parses %s as %s',
      async (tspParamType, expectedTypeName) => {
        // ARRANGE
        const tsp = `
          import "@typespec/http";

          @service
          namespace Petstore;

          interface Widgets {
            get(id: ${tspParamType}): string;
          }
        `;

        // ACT
        const { service, violations } = await parse(tsp);

        // ASSERT
        expect(violations).toHaveLength(0);
        const memberValue =
          service?.interfaces[0]?.methods[0]?.parameters[0]?.value;
        expectDefined(memberValue);
        expectPrimitive(memberValue);
        expect(memberValue.typeName.value).toBe(expectedTypeName);
      },
    );
  });

  describe('isArray', () => {
    it('is undefined for non-array values', async () => {
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
      const memberValue =
        service?.interfaces[0]?.methods[0]?.parameters[0]?.value;
      expectDefined(memberValue);
      expect(memberValue.isArray).toBeUndefined();
    });

    it('parses a TrueLiteral for array values', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          get(id: string[]): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const memberValue =
        service?.interfaces[0]?.methods[0]?.parameters[0]?.value;
      expectDefined(memberValue);
      expectDefined(memberValue.isArray);
      expect(memberValue.isArray.value).toBe(true);
    });
  });

  describe('isNullable', () => {
    it.todo('works');
  });

  describe('isOptional', () => {
    it('is undefined for required values', async () => {
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
      const memberValue =
        service?.interfaces[0]?.methods[0]?.parameters[0]?.value;
      expectDefined(memberValue);
      expect(memberValue.isOptional).toBeUndefined();
    });

    it('parses a TrueLiteral for optional values', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          get(id?: string): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const memberValue =
        service?.interfaces[0]?.methods[0]?.parameters[0]?.value;
      expectDefined(memberValue);
      expectDefined(memberValue.isOptional);
      expect(memberValue.isOptional.value).toBe(true);
    });
  });

  describe('constant', () => {
    it('is undefined when the value is not a constant', async () => {
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
      const memberValue =
        service?.interfaces[0]?.methods[0]?.parameters[0]?.value;
      expectDefined(memberValue);
      expectPrimitive(memberValue);
      expect(memberValue.constant).toBeUndefined();
    });

    it('parses boolean constants', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          get(id: true): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const memberValue =
        service?.interfaces[0]?.methods[0]?.parameters[0]?.value;
      expectDefined(memberValue);
      expectPrimitive(memberValue);
      expectDefined(memberValue.constant);
      expect(memberValue.typeName.value).toBe('boolean');
      expect(memberValue.constant.value).toBe(true);
    });

    it('parses numeric constants', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          get(id: 10.5): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const memberValue =
        service?.interfaces[0]?.methods[0]?.parameters[0]?.value;
      expectDefined(memberValue);
      expectPrimitive(memberValue);
      expectDefined(memberValue.constant);
      expect(memberValue.typeName.value).toBe('number');
      expect(memberValue.constant.value).toBe(10.5);
    });

    it('parses string constants', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          get(id: "widget-1"): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const memberValue =
        service?.interfaces[0]?.methods[0]?.parameters[0]?.value;
      expectDefined(memberValue);
      expectPrimitive(memberValue);
      expectDefined(memberValue.constant);
      expect(memberValue.typeName.value).toBe('string');
      expect(memberValue.constant.value).toBe('widget-1');
    });
  });

  describe('default', () => {
    it('is undefined when the value does not have a default', async () => {
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
      const memberValue =
        service?.interfaces[0]?.methods[0]?.parameters[0]?.value;
      expectDefined(memberValue);
      expectPrimitive(memberValue);
      expect(memberValue.default).toBeUndefined();
    });

    it('parses a boolean default', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          get(id: boolean = true): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const memberValue =
        service?.interfaces[0]?.methods[0]?.parameters[0]?.value;
      expectDefined(memberValue);
      expectPrimitive(memberValue);
      expectDefined(memberValue.default);
      expect(memberValue.typeName.value).toBe('boolean');
      expect(memberValue.default.value).toBe(true);
    });

    it('parses a numeric default', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";
        

        @service
        namespace Petstore;

        interface Widgets {
          get(id: numeric = 10.5): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const memberValue =
        service?.interfaces[0]?.methods[0]?.parameters[0]?.value;
      expectDefined(memberValue);
      expectPrimitive(memberValue);
      expectDefined(memberValue.default);
      expect(memberValue.typeName.value).toBe('number');
      expect(memberValue.default.value).toBe(10.5);
    });

    it('parses a string default', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          get(id: string = "widget-1"): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const memberValue =
        service?.interfaces[0]?.methods[0]?.parameters[0]?.value;
      expectDefined(memberValue);
      expectPrimitive(memberValue);
      expectDefined(memberValue.default);
      expect(memberValue.typeName.value).toBe('string');
      expect(memberValue.default.value).toBe('widget-1');
    });
  });
});
