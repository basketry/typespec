import { Range, Violation } from 'basketry';

const defaultRange: Range = {
  start: { line: 1, column: 1, offset: 0 },
  end: { line: 1, column: 1, offset: 0 },
};

/**
 * Creates an info violation indicating a TypeSpec scalar was mapped to an IR primitive type.
 */
export function typeCoercion(
  typespecScalar: string,
  irPrimitive: string,
  sourcePath: string,
  range: Range,
): Violation {
  return {
    code: 'typespec/type-coercion',
    severity: 'info',
    message: `TypeSpec scalar '${typespecScalar}' was mapped to IR primitive '${irPrimitive}'.`,
    sourcePath,
    range,
  };
}

/**
 * Creates a warning violation indicating a TypeSpec feature is not supported by the parser.
 */
export function unsupportedFeature(
  feature: string,
  sourcePath: string,
  range: Range,
): Violation {
  return {
    code: 'typespec/unsupported-feature',
    severity: 'warning',
    message: `Unsupported TypeSpec feature: '${feature}'.`,
    sourcePath,
    range,
  };
}

/**
 * Creates a warning violation indicating that no version information was found in the source.
 */
export function missingVersion(sourcePath: string): Violation {
  return {
    code: 'typespec/missing-version',
    severity: 'warning',
    message:
      'No version information found. Consider adding a @versioned decorator.',
    sourcePath,
    range: defaultRange,
  };
}

/**
 * Creates an error violation indicating the source file could not be found.
 */
export function sourceNotFound(filePath: string): Violation {
  return {
    code: 'typespec/source-not-found',
    severity: 'error',
    message: `Source file not found: '${filePath}'.`,
    sourcePath: filePath,
    range: defaultRange,
  };
}

/**
 * Creates an info violation indicating that numeric enum members were coerced to strings.
 */
export function numericEnum(
  enumName: string,
  sourcePath: string,
  range: Range,
): Violation {
  return {
    code: 'typespec/numeric-enum',
    severity: 'info',
    message: `Enum '${enumName}' has numeric members that were coerced to strings.`,
    sourcePath,
    range,
  };
}

/**
 * Converts a TypeSpec compiler diagnostic into a Basketry Violation.
 */
export function convertDiagnostic(
  diagnostic: {
    code: string;
    severity: 'error' | 'warning';
    message: string;
    target: unknown;
  },
  fallbackSourcePath: string,
  resolveRange: (
    target: unknown,
  ) => { sourcePath: string; range: Range } | undefined,
): Violation {
  const resolved = resolveRange(diagnostic.target);
  return {
    code: `typespec/${diagnostic.code}`,
    severity: diagnostic.severity,
    message: diagnostic.message,
    sourcePath: resolved?.sourcePath ?? fallbackSourcePath,
    range: resolved?.range ?? defaultRange,
  };
}
