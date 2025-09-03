import { ValidationRule } from 'basketry';
import { expectDefined } from '../test-utils.js';

export function expectRuleId<T extends ValidationRule['id']>(
  rule: ValidationRule | undefined,
  id: T,
): asserts rule is Extract<ValidationRule, { id: T }> {
  expectDefined(rule);
  expect(rule.kind).toBe('ValidationRule');
  expect(rule.id).toBe(id);
}
