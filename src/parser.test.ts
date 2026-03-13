import { validate } from 'basketry';
import * as path from 'path';
import { fileURLToPath } from 'url';
import parser from '.';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function parseFixture(name: string) {
  const absoluteSourcePath = path.resolve(__dirname, 'snapshot', name, 'main.tsp');
  return parser('', absoluteSourcePath);
}

describe('parser', () => {
  it('parses the petstore fixture into a valid Service', async () => {
    const { service, violations } = await parseFixture('petstore');
    expect(service).toBeDefined();
    expect(service.kind).toBe('Service');
    expect(service.basketry).toBe('0.2');
    const validation = validate(service);
    expect(validation.errors).toEqual([]);
    expect(service.interfaces.length).toBeGreaterThan(0);
    expect(service.interfaces[0].methods.length).toBeGreaterThan(0);
    const errors = violations.filter((v) => v.severity === 'error');
    expect(errors).toEqual([]);
  });

  it('extracts service title', async () => {
    const { service } = await parseFixture('petstore');
    expect(service.title.value).toBe('Pet Store Service');
  });

  it('parses model types with properties', async () => {
    const { service } = await parseFixture('petstore');
    const petType = service.types.find((t) => t.name.value === 'Pet');
    expect(petType).toBeDefined();
    expect(petType!.properties.length).toBeGreaterThan(0);
  });

  it('parses enums', async () => {
    const { service } = await parseFixture('petstore');
    const petStatus = service.enums.find((e) => e.name.value === 'PetStatus');
    expect(petStatus).toBeDefined();
    expect(petStatus!.members.length).toBe(3);
  });

  it('handles optional properties', async () => {
    const { service } = await parseFixture('petstore');
    const petType = service.types.find((t) => t.name.value === 'Pet');
    const tagProp = petType?.properties.find((p) => p.name.value === 'tag');
    expect(tagProp?.value.isOptional).toEqual({ kind: 'TrueLiteral', value: true });
  });

  it('all referenced type names exist in types/enums/unions', async () => {
    const { service } = await parseFixture('petstore');
    const allTypeNames = new Set([
      ...service.types.map((t) => t.name.value),
      ...service.enums.map((e) => e.name.value),
      ...service.unions.map((u) => u.name.value),
    ]);
    for (const iface of service.interfaces) {
      for (const method of iface.methods) {
        for (const param of method.parameters) {
          if (param.value.kind === 'ComplexValue') {
            expect(allTypeNames).toContain(param.value.typeName.value);
          }
        }
        if (method.returns?.value.kind === 'ComplexValue') {
          expect(allTypeNames).toContain(method.returns.value.typeName.value);
        }
      }
    }
  });

  it('generates HTTP routes with correct verbs', async () => {
    const { service } = await parseFixture('petstore');
    for (const iface of service.interfaces) {
      expect(iface.protocols?.http).toBeDefined();
      expect(iface.protocols!.http!.length).toBeGreaterThan(0);
      for (const route of iface.protocols!.http!) {
        expect(route.pattern.value).toMatch(/^\//);
        for (const method of route.methods) {
          expect(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']).toContain(method.verb.value);
        }
      }
    }
  });

  it('maps parameter locations correctly', async () => {
    const { service } = await parseFixture('petstore');
    const allHttpParams = service.interfaces
      .flatMap((i) => i.protocols?.http ?? [])
      .flatMap((r) => r.methods)
      .flatMap((m) => m.parameters);
    for (const param of allHttpParams) {
      expect(['header', 'query', 'path', 'formData', 'body']).toContain(param.location.value);
    }
  });

  it('includes auth security on methods', async () => {
    const { service } = await parseFixture('petstore');
    // Petstore has @useAuth(BearerAuth) at namespace level
    const firstMethod = service.interfaces[0]?.methods[0];
    expect(firstMethod?.security.length).toBeGreaterThan(0);
  });
});
