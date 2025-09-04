import { parse } from '../test-utils.js';
import { expectRuleId } from './rule-utils.js';

describe('4.2.10 ArrayMinItemsRule', () => {
  describe('parameters', () => {
    it('parses an array min items rule', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          get(@minItems(9) id: string[]): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const rule =
        service?.interfaces[0]?.methods[0]?.parameters[0]?.value.rules[0];

      expectRuleId(rule, 'ArrayMinItems');
      expect(rule.min.value).toBe(9);
    });
  });

  describe('properties', () => {
    it('parses an array min items rule', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        model Widget {
          @minItems(9) id: string[];
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

      expectRuleId(rule, 'ArrayMinItems');
      expect(rule.min.value).toBe(9);
    });
  });
});
