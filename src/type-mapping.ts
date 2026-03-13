export interface ScalarMapping {
  primitive: string;
  rules: ValidationRule[];
  coerced: boolean;
}

export type ValidationRule = NumberGTERule | NumberLTERule | StringFormatRule;

interface NumberGTERule {
  kind: 'ValidationRule';
  id: 'NumberGTE';
  value: { kind: 'NumberLiteral'; value: number };
}

interface NumberLTERule {
  kind: 'ValidationRule';
  id: 'NumberLTE';
  value: { kind: 'NumberLiteral'; value: number };
}

interface StringFormatRule {
  kind: 'ValidationRule';
  id: 'StringFormat';
  format: { kind: 'NonEmptyStringLiteral'; value: string };
}

function numberGTE(value: number): NumberGTERule {
  return {
    kind: 'ValidationRule',
    id: 'NumberGTE',
    value: { kind: 'NumberLiteral', value },
  };
}

function numberLTE(value: number): NumberLTERule {
  return {
    kind: 'ValidationRule',
    id: 'NumberLTE',
    value: { kind: 'NumberLiteral', value },
  };
}

function stringFormat(format: string): StringFormatRule {
  return {
    kind: 'ValidationRule',
    id: 'StringFormat',
    format: { kind: 'NonEmptyStringLiteral', value: format },
  };
}

const SCALAR_MAP: Record<string, ScalarMapping> = {
  // Direct mappings (coerced: false)
  string: { primitive: 'string', rules: [], coerced: false },
  boolean: { primitive: 'boolean', rules: [], coerced: false },
  int32: { primitive: 'integer', rules: [], coerced: false },
  int64: { primitive: 'long', rules: [], coerced: false },
  float32: { primitive: 'float', rules: [], coerced: false },
  float64: { primitive: 'double', rules: [], coerced: false },
  plainDate: { primitive: 'date', rules: [], coerced: false },
  utcDateTime: { primitive: 'date-time', rules: [], coerced: false },
  offsetDateTime: { primitive: 'date-time', rules: [], coerced: false },
  bytes: { primitive: 'binary', rules: [], coerced: false },
  numeric: { primitive: 'number', rules: [], coerced: false },
  integer: { primitive: 'integer', rules: [], coerced: false },
  float: { primitive: 'float', rules: [], coerced: false },

  // Coerced mappings (coerced: true)
  int8: {
    primitive: 'integer',
    rules: [numberGTE(-128), numberLTE(127)],
    coerced: true,
  },
  int16: {
    primitive: 'integer',
    rules: [numberGTE(-32768), numberLTE(32767)],
    coerced: true,
  },
  uint8: {
    primitive: 'integer',
    rules: [numberGTE(0), numberLTE(255)],
    coerced: true,
  },
  uint16: {
    primitive: 'integer',
    rules: [numberGTE(0), numberLTE(65535)],
    coerced: true,
  },
  uint32: {
    primitive: 'long',
    rules: [numberGTE(0), numberLTE(4294967295)],
    coerced: true,
  },
  uint64: {
    primitive: 'long',
    rules: [numberGTE(0)],
    coerced: true,
  },
  decimal: {
    primitive: 'number',
    rules: [stringFormat('decimal')],
    coerced: true,
  },
  decimal128: {
    primitive: 'number',
    rules: [stringFormat('decimal')],
    coerced: true,
  },
  plainTime: {
    primitive: 'string',
    rules: [stringFormat('time')],
    coerced: true,
  },
  duration: {
    primitive: 'string',
    rules: [stringFormat('duration')],
    coerced: true,
  },
  url: {
    primitive: 'string',
    rules: [stringFormat('uri')],
    coerced: true,
  },
};

const UNKNOWN_MAPPING: ScalarMapping = {
  primitive: 'untyped',
  rules: [],
  coerced: false,
};

export function mapScalar(scalarName: string): ScalarMapping {
  return SCALAR_MAP[scalarName] ?? UNKNOWN_MAPPING;
}

export function isKnownScalar(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(SCALAR_MAP, name);
}
