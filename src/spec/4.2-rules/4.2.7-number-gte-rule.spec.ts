import { parse } from '../test-utils.js';
import { expectRuleId } from './rule-utils.js';

describe('4.2.6 NumberGteRule', () => {
  describe('parameters', () => {
    it('parses a number greater than or equal to rule', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          get(@minValue(42) id: numeric): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const rule =
        service?.interfaces[0]?.methods[0]?.parameters[0]?.value.rules[0];

      expectRuleId(rule, 'NumberGTE');
      expect(rule.value.value).toBe(42);
    });
  });

  describe('properties', () => {
    it('parses a number greater than or equal to rule', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        model Widget {
          @minValue(42) id: numeric;
        }

        interface Widgets {
          create(widget: Widget): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const rule = service?.types[0]?.properties[0]?.value.rules[0];

      expectRuleId(rule, 'NumberGTE');
      expect(rule.value.value).toBe(42);
    });
  });
});
