import { parse } from '../test-utils.js';
import { expectRuleId } from './rule-utils.js';

describe('4.2.4 StringFormatRule', () => {
  describe('parameters', () => {
    it('parses a string format rule', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        interface Widgets {
          get(@format("uri") id: string): string;
        }
      `;

      // ACT
      const { service, violations } = await parse(tsp);

      // ASSERT
      expect(violations).toHaveLength(0);
      const rule =
        service?.interfaces[0]?.methods[0]?.parameters[0]?.value.rules[0];

      expectRuleId(rule, 'StringFormat');
      expect(rule.format.value).toBe('uri');
    });
  });

  describe('properties', () => {
    it('parses a string format rule', async () => {
      // ARRANGE
      const tsp = `
        import "@typespec/http";

        @service
        namespace Petstore;

        model Widget {
          @format("uri") id: string;
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

      expectRuleId(rule, 'StringFormat');
      expect(rule.format.value).toBe('uri');
    });
  });
});
