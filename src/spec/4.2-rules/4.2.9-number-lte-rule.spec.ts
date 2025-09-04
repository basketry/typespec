import { parse } from '../test-utils.js';
import { expectRuleId } from './rule-utils.js';

describe('4.2.9 NumberLteRule', () => {
  describe('parameters', () => {
    it('parses a number less than or equal to rule', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          get(@maxValue(21) id: numeric): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const rule =
        service?.interfaces[0]?.methods[0]?.parameters[0]?.value.rules[0];

      expectRuleId(rule, 'NumberLTE');
      expect(rule.value.value).toBe(21);
    });
  });

  describe('properties', () => {
    it('parses a number less than or equal to rule', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        model Widget {
          @maxValue(21) id: numeric;
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

      expectRuleId(rule, 'NumberLTE');
      expect(rule.value.value).toBe(21);
    });
  });
});
