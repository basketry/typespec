import { validate } from 'basketry';
import { readFileSync } from 'fs';
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

  describe('example multi-file fixture', () => {
    it('parses multi-file example into a valid Service', async () => {
      const { service } = await parseFixture('example');
      expect(service).toBeDefined();
      expect(service.kind).toBe('Service');
      expect(service.basketry).toBe('0.2');
      const validation = validate(service);
      expect(validation.errors).toEqual([]);
    });

    it('extracts example service title', async () => {
      const { service } = await parseFixture('example');
      expect(service.title.value).toBe('Example Service');
    });

    it('parses multi-file example with correct sourcePaths', async () => {
      const { service } = await parseFixture('example');

      expect(service.sourcePaths.length).toBeGreaterThan(1);
      expect(service.sourcePaths).toContainEqual(
        expect.stringContaining('models.tsp'),
      );
      expect(service.sourcePaths).toContainEqual(
        expect.stringContaining('operations.tsp'),
      );
    });

    it('multi-file nodes have different sourceIndex values in loc', async () => {
      const { service } = await parseFixture('example');

      // Collect all loc strings from types, methods, and properties
      const typeLocs = service.types.map((t) => t.loc);
      const methodLocs = service.interfaces
        .flatMap((i) => i.methods)
        .map((m) => m.loc);
      const allLocs = [...typeLocs, ...methodLocs].filter(
        (loc): loc is string => loc !== undefined,
      );

      // Extract sourceIndex (first number before the colon)
      const indices = new Set(allLocs.map((loc) => loc.split(':')[0]));

      // Should have more than one source index (multi-file)
      expect(indices.size).toBeGreaterThan(1);
    });

    it('has multiple types including inheritance', async () => {
      const { service } = await parseFixture('example');
      expect(service.types.length).toBeGreaterThan(1);
      const widget = service.types.find((t) => t.name.value === 'Widget');
      expect(widget).toBeDefined();
      // Widget extends BaseEntity, so should have inherited properties
      const idProp = widget?.properties.find((p) => p.name.value === 'id');
      expect(idProp).toBeDefined();
    });

    it('has both string and numeric enums', async () => {
      const { service } = await parseFixture('example');
      const colorEnum = service.enums.find((e) => e.name.value === 'Color');
      expect(colorEnum).toBeDefined();
      expect(colorEnum!.members.length).toBe(3);

      const priorityEnum = service.enums.find((e) => e.name.value === 'Priority');
      expect(priorityEnum).toBeDefined();
      expect(priorityEnum!.members.length).toBe(3);
    });

    it('has named unions', async () => {
      const { service } = await parseFixture('example');
      expect(service.unions.length).toBeGreaterThan(0);
      const stringOrInt = service.unions.find((u) => u.name.value === 'StringOrInt');
      expect(stringOrInt).toBeDefined();
    });

    it('has multiple interfaces', async () => {
      const { service } = await parseFixture('example');
      expect(service.interfaces.length).toBeGreaterThan(1);
      const widgetsIface = service.interfaces.find((i) => i.name.value === 'Widgets');
      expect(widgetsIface).toBeDefined();
      const adminIface = service.interfaces.find((i) => i.name.value === 'AdminWidgets');
      expect(adminIface).toBeDefined();
    });

    it('has all HTTP verbs in Widgets interface', async () => {
      const { service } = await parseFixture('example');
      const widgetsIface = service.interfaces.find((i) => i.name.value === 'Widgets');
      expect(widgetsIface).toBeDefined();
      const allVerbs = widgetsIface!.protocols!.http!.flatMap((r) =>
        r.methods.map((m) => m.verb.value),
      );
      expect(allVerbs).toContain('get');
      expect(allVerbs).toContain('post');
      expect(allVerbs).toContain('put');
      expect(allVerbs).toContain('patch');
      expect(allVerbs).toContain('delete');
    });

    it('Widget has nullable deletedAt property', async () => {
      const { service } = await parseFixture('example');
      const widget = service.types.find((t) => t.name.value === 'Widget');
      const deletedAt = widget?.properties.find((p) => p.name.value === 'deletedAt');
      expect(deletedAt).toBeDefined();
      expect((deletedAt?.value as any).isNullable).toEqual({ kind: 'TrueLiteral', value: true });
    });

    it('Widget has array tags property', async () => {
      const { service } = await parseFixture('example');
      const widget = service.types.find((t) => t.name.value === 'Widget');
      const tags = widget?.properties.find((p) => p.name.value === 'tags');
      expect(tags).toBeDefined();
      expect((tags?.value as any).isArray).toEqual({ kind: 'TrueLiteral', value: true });
    });
  });

  describe('scalar mapping', () => {
    it('applies range constraints for int8 properties', async () => {
      const { service } = await parseFixture('example');

      // Find a type with an int8 property (ScalarShowcase.tinyInt)
      const scalarType = service.types.find((t) => t.name.value === 'ScalarShowcase');
      expect(scalarType).toBeDefined();

      const tinyIntProp = scalarType!.properties.find((p) => p.name.value === 'tinyInt');
      expect(tinyIntProp).toBeDefined();
      expect(tinyIntProp!.value.kind).toBe('PrimitiveValue');

      const primitiveVal = tinyIntProp!.value as any;
      expect(primitiveVal.typeName.value).toBe('integer');
      expect(primitiveVal.rules.length).toBeGreaterThan(0);
      expect(primitiveVal.rules.some((r: any) => r.id === 'NumberGTE')).toBe(true);
      expect(primitiveVal.rules.some((r: any) => r.id === 'NumberLTE')).toBe(true);
    });

    it('emits type-coercion violations for coerced scalars', async () => {
      const { violations } = await parseFixture('example');

      const coercions = violations.filter(
        (v) => v.code === 'typespec/type-coercion',
      );
      expect(coercions.length).toBeGreaterThan(0);
    });

    it('maps url scalar with StringFormat uri rule', async () => {
      const { service } = await parseFixture('example');

      const scalarType = service.types.find((t) => t.name.value === 'ScalarShowcase');
      const urlProp = scalarType!.properties.find((p) => p.name.value === 'website');
      expect(urlProp).toBeDefined();

      const primitiveVal = urlProp!.value as any;
      expect(primitiveVal.typeName.value).toBe('string');
      expect(primitiveVal.rules.some((r: any) => r.id === 'StringFormat' && r.format.value === 'uri')).toBe(true);
    });

    it('maps plainDate as direct (non-coerced) date', async () => {
      const { service } = await parseFixture('example');

      const scalarType = service.types.find((t) => t.name.value === 'ScalarShowcase');
      const dateProp = scalarType!.properties.find((p) => p.name.value === 'dateField');
      expect(dateProp).toBeDefined();

      const primitiveVal = dateProp!.value as any;
      expect(primitiveVal.typeName.value).toBe('date');
      expect(primitiveVal.rules).toEqual([]);
    });
  });

  describe('snapshots', () => {
    it('recreates a valid petstore snapshot', async () => {
      const snapshot = JSON.parse(
        readFileSync(
          path.join(__dirname, 'snapshot', 'petstore-snapshot.json'),
        ).toString(),
      );

      const { service } = await parseFixture('petstore');
      const result = JSON.parse(
        JSON.stringify(service, removeLoc),
      );

      expect(result).toStrictEqual(snapshot);
    });

    it('recreates a valid example snapshot', async () => {
      const snapshot = JSON.parse(
        readFileSync(
          path.join(__dirname, 'snapshot', 'example-snapshot.json'),
        ).toString(),
      );

      const { service } = await parseFixture('example');
      const result = JSON.parse(
        JSON.stringify(service, removeLoc),
      );

      expect(result).toStrictEqual(snapshot);
    });
  });
});

describe('diagnostics', () => {
  it('returns violations for TypeSpec compiler errors', async () => {
    const absoluteSourcePath = path.resolve(
      __dirname,
      'snapshot',
      'invalid',
      'missing-import.tsp',
    );
    const { violations } = await parser('', absoluteSourcePath);

    const errors = violations.filter((v) => v.severity === 'error');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toMatch(/^typespec\//);
  });

  it('returns error violation for non-existent source file', async () => {
    const { violations } = await parser('', '/nonexistent/main.tsp');

    const errors = violations.filter((v) => v.severity === 'error');
    expect(errors.length).toBeGreaterThan(0);
  });
});

function removeLoc(key: string, value: any): any {
  return key === 'loc' ? undefined : value;
}
