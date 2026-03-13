import { Range } from 'basketry';
import {
  typeCoercion,
  unsupportedFeature,
  missingVersion,
  sourceNotFound,
  numericEnum,
  convertDiagnostic,
} from './violations';

const testRange: Range = {
  start: { line: 5, column: 3, offset: 42 },
  end: { line: 5, column: 10, offset: 49 },
};

const defaultRange: Range = {
  start: { line: 1, column: 1, offset: 0 },
  end: { line: 1, column: 1, offset: 0 },
};

describe('typeCoercion', () => {
  it('creates an info violation with the correct code and severity', () => {
    const v = typeCoercion('numeric', 'number', 'service.tsp', testRange);
    expect(v.code).toBe('typespec/type-coercion');
    expect(v.severity).toBe('info');
  });

  it('includes sourcePath and range', () => {
    const v = typeCoercion('numeric', 'number', 'service.tsp', testRange);
    expect(v.sourcePath).toBe('service.tsp');
    expect(v.range).toEqual(testRange);
  });

  it('message contains both the typespec scalar and the IR primitive', () => {
    const v = typeCoercion('numeric', 'number', 'service.tsp', testRange);
    expect(v.message).toContain('numeric');
    expect(v.message).toContain('number');
  });
});

describe('unsupportedFeature', () => {
  it('creates a warning violation with the correct code and severity', () => {
    const v = unsupportedFeature('decorators', 'service.tsp', testRange);
    expect(v.code).toBe('typespec/unsupported-feature');
    expect(v.severity).toBe('warning');
  });

  it('includes sourcePath and range', () => {
    const v = unsupportedFeature('decorators', 'service.tsp', testRange);
    expect(v.sourcePath).toBe('service.tsp');
    expect(v.range).toEqual(testRange);
  });
});

describe('missingVersion', () => {
  it('creates a warning violation with the correct code and severity', () => {
    const v = missingVersion('service.tsp');
    expect(v.code).toBe('typespec/missing-version');
    expect(v.severity).toBe('warning');
  });

  it('uses default range at position 1:1:0', () => {
    const v = missingVersion('service.tsp');
    expect(v.range).toEqual(defaultRange);
  });

  it('includes sourcePath', () => {
    const v = missingVersion('service.tsp');
    expect(v.sourcePath).toBe('service.tsp');
  });
});

describe('sourceNotFound', () => {
  it('creates an error violation with the correct code and severity', () => {
    const v = sourceNotFound('/path/to/missing.tsp');
    expect(v.code).toBe('typespec/source-not-found');
    expect(v.severity).toBe('error');
  });

  it('uses the filePath as sourcePath', () => {
    const v = sourceNotFound('/path/to/missing.tsp');
    expect(v.sourcePath).toBe('/path/to/missing.tsp');
  });

  it('uses default range at position 1:1:0', () => {
    const v = sourceNotFound('/path/to/missing.tsp');
    expect(v.range).toEqual(defaultRange);
  });
});

describe('numericEnum', () => {
  it('creates an info violation with the correct code and severity', () => {
    const v = numericEnum('Status', 'service.tsp', testRange);
    expect(v.code).toBe('typespec/numeric-enum');
    expect(v.severity).toBe('info');
  });

  it('message mentions the enum name', () => {
    const v = numericEnum('Status', 'service.tsp', testRange);
    expect(v.message).toContain('Status');
  });

  it('message mentions that members were coerced to strings', () => {
    const v = numericEnum('Status', 'service.tsp', testRange);
    expect(v.message.toLowerCase()).toMatch(/string/);
  });

  it('includes sourcePath and range', () => {
    const v = numericEnum('Status', 'service.tsp', testRange);
    expect(v.sourcePath).toBe('service.tsp');
    expect(v.range).toEqual(testRange);
  });
});

describe('convertDiagnostic', () => {
  const diagnostic = {
    code: 'unknown-identifier',
    severity: 'error' as const,
    message: 'Unknown identifier foo',
    target: {},
  };

  it('prefixes the code with typespec/', () => {
    const v = convertDiagnostic(diagnostic, 'fallback.tsp', () => undefined);
    expect(v.code).toBe('typespec/unknown-identifier');
  });

  it('preserves the severity and message from the diagnostic', () => {
    const v = convertDiagnostic(diagnostic, 'fallback.tsp', () => undefined);
    expect(v.severity).toBe('error');
    expect(v.message).toBe('Unknown identifier foo');
  });

  it('uses the resolved range and sourcePath when resolveRange returns a value', () => {
    const resolved = { sourcePath: 'resolved.tsp', range: testRange };
    const v = convertDiagnostic(diagnostic, 'fallback.tsp', () => resolved);
    expect(v.sourcePath).toBe('resolved.tsp');
    expect(v.range).toEqual(testRange);
  });

  it('falls back to default range and fallbackSourcePath when resolveRange returns undefined', () => {
    const v = convertDiagnostic(diagnostic, 'fallback.tsp', () => undefined);
    expect(v.sourcePath).toBe('fallback.tsp');
    expect(v.range).toEqual(defaultRange);
  });
});
