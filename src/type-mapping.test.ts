import { describe, it, expect } from 'vitest';
import { mapScalar, isKnownScalar } from './type-mapping';

describe('mapScalar - direct mappings (coerced: false)', () => {
  it.each([
    ['string', 'string'],
    ['boolean', 'boolean'],
    ['int32', 'integer'],
    ['int64', 'long'],
    ['float32', 'float'],
    ['float64', 'double'],
    ['plainDate', 'date'],
    ['utcDateTime', 'date-time'],
    ['offsetDateTime', 'date-time'],
    ['bytes', 'binary'],
    ['numeric', 'number'],
    ['integer', 'integer'],
    ['float', 'float'],
  ])('%s maps to primitive %s with coerced: false', (scalar, primitive) => {
    const result = mapScalar(scalar);
    expect(result.primitive).toBe(primitive);
    expect(result.coerced).toBe(false);
  });
});

describe('mapScalar - coerced mappings (coerced: true)', () => {
  it.each([
    ['int8', 'integer'],
    ['int16', 'integer'],
    ['uint8', 'integer'],
    ['uint16', 'integer'],
    ['uint32', 'long'],
    ['uint64', 'long'],
    ['decimal', 'number'],
    ['decimal128', 'number'],
    ['plainTime', 'string'],
    ['duration', 'string'],
    ['url', 'string'],
  ])('%s maps to primitive %s with coerced: true', (scalar, primitive) => {
    const result = mapScalar(scalar);
    expect(result.primitive).toBe(primitive);
    expect(result.coerced).toBe(true);
  });
});

describe('mapScalar - validation rules', () => {
  it('int8 produces NumberGTE(-128) and NumberLTE(127) rules', () => {
    const result = mapScalar('int8');
    expect(result.rules).toContainEqual({
      kind: 'ValidationRule',
      id: 'NumberGTE',
      value: { kind: 'NumberLiteral', value: -128 },
    });
    expect(result.rules).toContainEqual({
      kind: 'ValidationRule',
      id: 'NumberLTE',
      value: { kind: 'NumberLiteral', value: 127 },
    });
  });

  it('uint8 produces NumberGTE(0) and NumberLTE(255) rules', () => {
    const result = mapScalar('uint8');
    expect(result.rules).toContainEqual({
      kind: 'ValidationRule',
      id: 'NumberGTE',
      value: { kind: 'NumberLiteral', value: 0 },
    });
    expect(result.rules).toContainEqual({
      kind: 'ValidationRule',
      id: 'NumberLTE',
      value: { kind: 'NumberLiteral', value: 255 },
    });
  });

  it('duration produces StringFormat("duration") rule', () => {
    const result = mapScalar('duration');
    expect(result.rules).toContainEqual({
      kind: 'ValidationRule',
      id: 'StringFormat',
      format: { kind: 'NonEmptyStringLiteral', value: 'duration' },
    });
  });

  it('url produces StringFormat("uri") rule', () => {
    const result = mapScalar('url');
    expect(result.rules).toContainEqual({
      kind: 'ValidationRule',
      id: 'StringFormat',
      format: { kind: 'NonEmptyStringLiteral', value: 'uri' },
    });
  });
});

describe('mapScalar - unknown scalar', () => {
  it('returns { primitive: "untyped", rules: [], coerced: false } for unknown scalar', () => {
    const result = mapScalar('unknownScalarXYZ');
    expect(result).toEqual({ primitive: 'untyped', rules: [], coerced: false });
  });
});

describe('isKnownScalar', () => {
  it('returns true for known scalars', () => {
    expect(isKnownScalar('string')).toBe(true);
    expect(isKnownScalar('int32')).toBe(true);
    expect(isKnownScalar('int8')).toBe(true);
    expect(isKnownScalar('url')).toBe(true);
    expect(isKnownScalar('decimal128')).toBe(true);
  });

  it('returns false for unknown scalars', () => {
    expect(isKnownScalar('unknownScalarXYZ')).toBe(false);
    expect(isKnownScalar('')).toBe(false);
    expect(isKnownScalar('untyped')).toBe(false);
  });
});
