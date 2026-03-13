import { Parser } from 'basketry';
import { TypeSpecParser } from './parser';
import * as violations from './violations';

const parse: Parser = async (_sourceContent, absoluteSourcePath) => {
  const parser = new TypeSpecParser(absoluteSourcePath);
  try {
    const service = await parser.parse();
    return { service, violations: parser.violations };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isNotFound =
      message.includes('ENOENT') ||
      message.includes('not found') ||
      message.includes('no such file');
    const violation = isNotFound
      ? violations.sourceNotFound(absoluteSourcePath)
      : {
          code: 'typespec/compile-error' as const,
          severity: 'error' as const,
          message,
          sourcePath: absoluteSourcePath,
          range: {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 1, offset: 0 },
          },
        };
    return {
      service: {
        kind: 'Service',
        basketry: '0.2',
        title: { kind: 'StringLiteral', value: 'Untitled Service' },
        majorVersion: { kind: 'IntegerLiteral', value: 1 },
        sourcePaths: [],
        interfaces: [],
        types: [],
        enums: [],
        unions: [],
      },
      violations: [violation],
    };
  }
};

export default parse;
