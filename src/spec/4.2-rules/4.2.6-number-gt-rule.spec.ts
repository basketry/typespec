import { parse } from '../test-utils.js';
import { expectRuleId } from './rule-utils.js';

describe('4.2.6 NumberGtRule', () => {
  describe('parameters', () => {
    it('parses a number greater than rule', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          get(@minValueExclusive(1337) id: numeric): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const rule =
        service?.interfaces[0]?.methods[0]?.parameters[0]?.value.rules[0];

      expectRuleId(rule, 'NumberGT');
      expect(rule.value.value).toBe(1337);
    });
  });

  describe('properties', () => {
    it('parses a number greater than rule', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        model Widget {
          @minValueExclusive(1337) id: numeric;
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

      expectRuleId(rule, 'NumberGT');
      expect(rule.value.value).toBe(1337);
    });
  });
});
