import { parse } from '../test-utils.js';
import { expectRuleId } from './rule-utils.js';

describe('4.2.1 StringMaxLengthRule', () => {
  describe('parameters', () => {
    it('parses a string max length rule', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          get(@maxLength(10) id: string): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const rule =
        service?.interfaces[0]?.methods[0]?.parameters[0]?.value.rules[0];

      expectRuleId(rule, 'StringMaxLength');
      expect(rule.length.value).toBe(10);
    });
  });

  describe('properties', () => {
    it('parses a string max length rule', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        model Widget {
          @maxLength(10) id: string;
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

      expectRuleId(rule, 'StringMaxLength');
      expect(rule.length.value).toBe(10);
    });
  });
});
