import * as path from 'path';
import casePkg from 'case';

import * as TSP from '@typespec/compiler';
import { getAllHttpServices, HttpService } from '@typespec/http';

import * as IR from '@basketry/ir';
import { SourcePathState } from './source-path-state.js';

import pkg from '../package.json' with { type: 'json' };
import { decodeRange } from 'basketry';

const { camel, snake } = casePkg;

export class TypespecParser {
  public static async create(
    context: IR.ParserContext,
    basketry: IR.BasketryContext,
  ): Promise<TypespecParser | undefined> {
    const absoluteSourcePath = path.resolve(
      basketry.projectDirectory,
      context.sourcePath,
    );

    const program: TSP.Program = await TSP.compile(
      TSP.NodeHost,
      absoluteSourcePath,
      {
        noEmit: true,
      },
    );

    const sourcePathState = new SourcePathState(absoluteSourcePath);

    const [services, diagnostics] = getAllHttpServices(program);
    if (services.length !== 1 || diagnostics.length) return;

    const service = services[0];

    return new TypespecParser(
      context,
      basketry,
      program,
      service,
      sourcePathState,
    );
  }
  private constructor(
    private readonly context: IR.ParserContext,
    private readonly basketry: IR.BasketryContext,
    private readonly program: TSP.Program,
    private readonly service: HttpService,
    private readonly sourcePathState: SourcePathState,
  ) {}

  private readonly types: Map<string, IR.Type> = new Map();
  private readonly enums: Map<string, IR.Enum> = new Map();
  private readonly unions: Map<string, IR.Union> = new Map();
  private readonly violations: IR.Violation[] = [];

  public async parse(): Promise<IR.ParseResult> {
    return {
      service: {
        kind: 'Service',
        basketry: '0.2',
        sourcePaths: Array.from(this.sourcePathState.sourcePaths),
        title: this.parseTitle(),
        majorVersion: this.parseMajorVersion(),
        interfaces: this.parseInterfaces(),
        types: Array.from(this.types.values()).sort(byName),
        enums: Array.from(this.enums.values()).sort(byName),
        unions: Array.from(this.unions.values()).sort(byName),
      },
      violations: this.violations,
    };
  }

  private parseTitle(): IR.StringLiteral {
    // TODO: handle service title, fall back to namespace name
    // TODO: encode a more precise range

    const title: IR.StringLiteral = {
      kind: 'StringLiteral',
      value: this.service.namespace.name,
      loc: this.sourcePathState.getEncodedRange(
        TSP.getSourceLocation(this.service.namespace.node),
      ),
    };

    return title;
  }

  private parseMajorVersion(): IR.IntegerLiteral {
    // TODO: handle service major version, fall back to 1

    return { kind: 'IntegerLiteral', value: 1 };
  }

  private parseInterfaces(): IR.Interface[] {
    return Array.from(this.service.namespace.interfaces.values()).map((int) =>
      this.parseInterface(int),
    );
  }

  private parseInterface(int: TSP.Interface): IR.Interface {
    return {
      kind: 'Interface',
      name: this.parseName(int),
      description: undefined, // TODO: parse interface description
      deprecated: undefined, // TODO: parse interface deprecated
      methods: this.parseMethods(int),
      meta: undefined, // TODO: parse interface meta
    };
  }

  private parseMethods(int: TSP.Interface): IR.Method[] {
    return Array.from(int.operations.values()).map((method) =>
      this.parseMethod(method),
    );
  }

  private parseMethod(op: TSP.Operation): IR.Method {
    return {
      kind: 'Method',
      name: this.parseName(op),
      description: undefined, // TODO: parse method description
      parameters: this.parseParameters(op),
      deprecated: undefined, // TODO: parse method deprecated
      returns: this.parseReturnValue(op),
      security: [],
      meta: undefined, // TODO: parse method meta
      loc: this.sourcePathState.getEncodedRange(TSP.getSourceLocation(op.node)),
    };
  }

  private parseParameters(op: TSP.Operation): IR.Parameter[] {
    return Array.from(op.parameters.properties.values()).map((property) =>
      this.parseParameter(property, op),
    );
  }

  private parseParameter(
    property: TSP.ModelProperty,
    op: TSP.Operation,
  ): IR.Parameter {
    // TODO: push violation for "void" parameters
    const value: IR.MemberValue = this.parseMemberValue(property.type, {
      defaultName: camel(
        `${op.interface?.name ?? ''}_${op.name}_${property.name}`,
      ),
    }) ?? {
      kind: 'PrimitiveValue',
      typeName: { kind: 'PrimitiveLiteral', value: 'untyped' },
      rules: [],
    };

    return {
      kind: 'Parameter',
      name: this.parseName(property),
      description: undefined, // TODO: parse parameter description
      deprecated: undefined, // TODO: parse parameter deprecated
      value,
      meta: undefined, // TODO: parse parameter meta
      loc: this.sourcePathState.getEncodedRange(
        TSP.getSourceLocation(property.node),
      ),
    };
  }

  private parseReturnValue(op: TSP.Operation): IR.ReturnValue | undefined {
    const value = this.parseMemberValue(op.returnType, {
      defaultName: camel(`${op.interface?.name ?? ''}_${op.name}_response`),
    });

    if (!value) return undefined;

    return {
      kind: 'ReturnValue',
      value,
      meta: undefined, // TODO: parse return meta
      loc: this.sourcePathState.getEncodedRange(
        TSP.getSourceLocation(op.returnType.node),
      ),
    };
  }

  private parseMemberValue(
    type: TSP.Type,
    options?: { asArray?: boolean; defaultName?: string },
  ): IR.MemberValue | undefined {
    const loc = this.sourcePathState.getEncodedRange(
      TSP.getSourceLocation(type),
    );

    switch (type.kind) {
      case 'Boolean': {
        return {
          kind: 'PrimitiveValue',
          typeName: { kind: 'PrimitiveLiteral', value: 'boolean', loc },
          constant: { kind: 'BooleanLiteral', value: type.value, loc },
          isArray: options?.asArray ? trueLiteral(loc) : undefined,
          rules: [],
        };
      }
      case 'Decorator':
        this.notSupported('Decorators are not supported', loc);
        break;
      case 'Enum':
        this.notSupported('Enums are not supported', loc);
        break;
      case 'EnumMember':
        this.notSupported('Enum members are not supported', loc);
        break;
      case 'FunctionParameter':
        this.notSupported('Function parameters are not supported', loc);
        break;
      case 'Interface':
        this.notSupported('Interfaces are not supported', loc);
        break;
      case 'Intrinsic': {
        let value: IR.PrimitiveLiteral['value'] = 'untyped';
        switch (type.name) {
          case 'null':
            value = 'null';
            break;
          case 'void': {
            return undefined;
          }
          default:
            value = 'untyped';
        }

        return {
          kind: 'PrimitiveValue',
          typeName: { kind: 'PrimitiveLiteral', value, loc },
          isArray: options?.asArray ? trueLiteral(loc) : undefined,
          rules: [],
        };
      }
      case 'Model':
        if (type.name === 'Array' && type.indexer?.value) {
          return this.parseMemberValue(type.indexer.value, {
            ...options,
            asArray: true,
          });
        }
        const t = this.parseType(type);
        return {
          kind: 'ComplexValue',
          typeName: t.name,
          isArray: options?.asArray ? trueLiteral() : undefined,
          rules: [],
        };
        break;
      case 'ModelProperty':
        this.notSupported('Model properties are not supported', loc);
        break;
      case 'Namespace':
        this.notSupported('Namespaces are not supported', loc);
        break;
      case 'Number':
        // TODO: parse integers and other formats
        return {
          kind: 'PrimitiveValue',
          typeName: { kind: 'PrimitiveLiteral', value: 'number', loc },
          constant: { kind: 'NumberLiteral', value: type.value, loc },
          isArray: options?.asArray ? trueLiteral(loc) : undefined,
          rules: [],
        };
      case 'Operation':
        this.notSupported('Operations are not supported', loc);
        break;
      case 'Scalar': {
        let value: IR.Primitive = 'untyped';
        switch (type.name) {
          // Numeric types
          case 'integer':
          case 'safeint':
          case 'int8':
          case 'uint8':
          case 'int16':
          case 'uint16':
          case 'int32':
          case 'uint32':
            value = 'integer';
            break;
          case 'int64':
          case 'uint64':
            value = 'long';
            break;
          case 'float':
          case 'float32':
            value = 'float';
            break;
          case 'float64':
            value = 'double';
            break;
          case 'numeric':
          case 'decimal':
          case 'decimal128':
            value = 'number';
            break;

          // String & related
          case 'string':
          case 'url':
            value = 'string';
            break;

          // Date/time
          case 'plainDate':
            value = 'date';
            break;
          case 'utcDateTime':
            value = 'date-time';
            break;
          case 'offsetDateTime':
            // TODO: emit violation
            value = 'untyped';
            break;

          // Boolean & bytes
          case 'boolean':
            value = 'boolean';
            break;
          case 'bytes':
            value = 'binary';
            break;

          // General
          case 'unknown':
            value = 'untyped';
            break;

          default:
            // Handle unexpected values
            // TODO: emit violation
            value = 'untyped';
            break;
        }
        return {
          kind: 'PrimitiveValue',
          typeName: { kind: 'PrimitiveLiteral', value, loc },
          isArray: options?.asArray ? trueLiteral(loc) : undefined,
          rules: [],
        };
      }
      case 'ScalarConstructor':
        this.notSupported('Scalar constructors are not supported', loc);
        break;
      case 'String': {
        return {
          kind: 'PrimitiveValue',
          typeName: { kind: 'PrimitiveLiteral', value: 'string', loc },
          constant: { kind: 'StringLiteral', value: type.value, loc },
          isArray: options?.asArray ? trueLiteral(loc) : undefined,
          rules: [],
        };
      }
      case 'StringTemplate':
        this.notSupported('String templates are not supported', loc);
        break;
      case 'StringTemplateSpan':
        this.notSupported('String template spans are not supported', loc);
        break;
      case 'TemplateParameter':
        this.notSupported('Template parameters are not supported', loc);
        break;
      case 'Tuple':
        this.notSupported('Tuples are not supported', loc);
        break;
      case 'Union': {
        const union = this.parseUnion(type, {
          defaultName: options?.defaultName,
        });
        return {
          kind: 'ComplexValue',
          typeName: { kind: 'StringLiteral', value: union.name.value, loc },
          isArray: options?.asArray ? trueLiteral(loc) : undefined,
          rules: [],
        };

        break;
      }
      case 'UnionVariant':
        this.notSupported('Union variants are not supported', loc);
        break;
      default: {
        return {
          kind: 'PrimitiveValue',
          typeName: { kind: 'PrimitiveLiteral', value: 'untyped', loc },
          isArray: options?.asArray ? trueLiteral(loc) : undefined,
          rules: [],
        };
      }
    }

    return {
      kind: 'PrimitiveValue',
      typeName: { kind: 'PrimitiveLiteral', value: 'untyped', loc },
      isArray: options?.asArray ? trueLiteral(loc) : undefined,
      rules: [],
    };
  }

  private parseUnion(
    union: TSP.Union,
    options?: { defaultName?: string },
  ): IR.Union {
    const members: IR.MemberValue[] = [];
    union.variants.forEach((variant) => {
      const member = this.parseMemberValue(variant.type);
      if (member) members.push(member);
    });

    const name: IR.StringLiteral = union.name
      ? this.parseName({ name: union.name, node: union.node })
      : {
          kind: 'StringLiteral',
          value: options?.defaultName ?? `union${this.unions.size}`,
        };

    const u: IR.Union = {
      kind: 'SimpleUnion',
      name,
      description: undefined, // TODO: handle description
      members,
      deprecated: undefined, // TODO: handle deprecation
      disjunction: undefined, // TODO: handle disjunction
      meta: undefined, // TODO: handle meta
      loc: this.sourcePathState.getEncodedRange(
        TSP.getSourceLocation(union.node),
      ),
    };
    this.addUnion(u);
    return u;
  }

  private parseType(model: TSP.Model): IR.Type {
    const properties: IR.Property[] = [];

    for (const [, prop] of model.properties) {
      const p = this.parseProperty(prop);
      if (p) properties.push(p);
    }

    const t: IR.Type = {
      kind: 'Type',
      name: this.parseName(model),
      description: undefined, // TODO: handle description
      properties,
      mapProperties: undefined, // TODO: handle mapProperties
      rules: [],
      deprecated: undefined, // TODO: handle deprecation
      meta: undefined, // TODO: handle meta
      loc: this.sourcePathState.getEncodedRange(
        TSP.getSourceLocation(model.node),
      ),
    };

    this.addType(t);

    return t;
  }

  private parseProperty(prop: TSP.ModelProperty): IR.Property {
    return {
      kind: 'Property',
      name: this.parseName(prop),
      description: undefined, // TODO: handle description
      value: this.parseMemberValue(prop.type, {
        defaultName: camel(`${prop.model?.name ?? ''}_${prop.name}`),
      }) ?? {
        // TODO: emit violation for this fallback
        kind: 'PrimitiveValue',
        typeName: { kind: 'PrimitiveLiteral', value: 'untyped' },
        rules: [],
      },
      deprecated: undefined, // TODO: handle deprecation
      meta: undefined, // TODO: handle meta
      loc: this.sourcePathState.getEncodedRange(
        TSP.getSourceLocation(prop.node),
      ),
    };
  }

  private parseName(named: {
    name: string;
    node?: TSP.DiagnosticTarget;
  }): IR.StringLiteral {
    return {
      kind: 'StringLiteral',
      value: named.name,
      loc: named.node
        ? this.sourcePathState.getEncodedRange(
            TSP.getSourceLocation(named.node),
          )
        : undefined,
    };
  }

  private addType(type: IR.Type): void {
    const key = snake(type.name.value);
    if (!this.types.has(key)) this.types.set(key, type);
  }

  private addEnum(e: IR.Enum): void {
    const key = snake(e.name.value);
    if (!this.enums.has(key)) this.enums.set(key, e);
  }

  private addUnion(union: IR.Union): void {
    const key = snake(union.name.value);
    if (!this.unions.has(key)) this.unions.set(key, union);
  }
  private notSupported(message: string, loc?: string): void {
    const { sourceIndex, range } = decodeRange(loc);
    const sourcePath = this.sourcePathState.sourcePaths[sourceIndex];

    this.addViolation({
      message,
      range,
      severity: 'warning',
      sourcePath,
    });
  }

  private addViolation(violation: Omit<IR.Violation, 'code' | 'link'>): void {
    this.violations.push({
      code: 'basketry/typespec',
      ...violation,
      link: pkg.homepage,
    });
  }
}

function byName(
  a: { name: IR.StringLiteral },
  b: { name: IR.StringLiteral },
): number {
  return a.name.value.localeCompare(b.name.value);
}

function trueLiteral(loc?: string): IR.TrueLiteral {
  return { kind: 'TrueLiteral', value: true, loc };
}
