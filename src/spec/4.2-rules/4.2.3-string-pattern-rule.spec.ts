import { parse } from '../test-utils.js';
import { expectRuleId } from './rule-utils.js';

describe('4.2.1 StringPatternRule', () => {
  describe('parameters', () => {
    it('parses a string pattern rule', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          get(@pattern("^[a-z0-9]+$") id: string): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const rule =
        service?.interfaces[0]?.methods[0]?.parameters[0]?.value.rules[0];

      expectRuleId(rule, 'StringPattern');
      expect(rule.pattern.value).toBe('^[a-z0-9]+$');
    });
  });

  describe('properties', () => {
    it('parses a string pattern rule', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        model Widget {
          @pattern("^[a-z0-9]+$") id: string;
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

      expectRuleId(rule, 'StringPattern');
      expect(rule.pattern.value).toBe('^[a-z0-9]+$');
    });
  });
});
