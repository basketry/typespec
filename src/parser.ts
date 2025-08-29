import { Parser, Service, Violation } from 'basketry';

export const typeSpecParser: Parser = (sourceContent, absoluteSourcePath) =>
  new TypeSpecParser(sourceContent, absoluteSourcePath).parse();

class TypeSpecParser {
  constructor(
    private readonly sourceContent: string,
    private readonly absoluteSourcePath: string,
  ) {}

  public readonly violations: Violation[] = [];

  parse(): {
    service: Service;
    violations: Violation[];
  } {
    return {
      service: {
        // Contant values
        kind: 'Service',
        basketry: '0.2',
        sourcePaths: [this.absoluteSourcePath],

        // TODO: parse from schema input
        title: { kind: 'StringLiteral', value: 'TODO' },
        majorVersion: { kind: 'IntegerLiteral', value: 1 },
        interfaces: [],
        types: [],
        enums: [],
        unions: [],
      },
      violations: this.violations,
    };
  }
}
