import {
  compile,
  NodeHost,
  isArrayModelType,
  getService as getServiceDetails,
  type Program,
  type Model,
  type Enum as TSEnum,
  type Union as TSUnion,
  type Scalar,
  type Type as TSType,
  type Namespace,
  type Interface as TSInterface,
} from '@typespec/compiler';
import {
  getAllHttpServices,
  resolveAuthentication,
  type HttpOperation,
  type HttpAuth,
  type Authentication,
} from '@typespec/http';
import type {
  Service,
  Violation,
  Interface,
  Method,
  Parameter,
  ReturnValue,
  Type,
  Property,
  Enum,
  EnumMember,
  Union,
  MemberValue,
  PrimitiveValue,
  ComplexValue,
  HttpRoute,
  HttpMethod,
  HttpParameter,
  SecurityOption,
  SecurityScheme,
  StringLiteral,
  IntegerLiteral,
  TrueLiteral,
} from 'basketry';
import { buildSourceIndex, encodeLoc } from './location';
import { mapScalar, isKnownScalar } from './type-mapping';
import * as violations from './violations';
import * as path from 'path';

const TRUE_LITERAL: TrueLiteral = { kind: 'TrueLiteral', value: true };

function str(value: string, loc?: string): StringLiteral {
  return loc
    ? { kind: 'StringLiteral', value, loc }
    : { kind: 'StringLiteral', value };
}

function int(value: number, loc?: string): IntegerLiteral {
  return loc
    ? { kind: 'IntegerLiteral', value, loc }
    : { kind: 'IntegerLiteral', value };
}

export class TypeSpecParser {
  private absoluteSourcePath: string;
  private projectDirectory: string;
  violations: Violation[] = [];

  private program!: Program;
  private sourceIndexMap!: Map<string, number>;
  private sourcePaths!: string[];

  // Collected IR entities (demand-driven)
  private collectedTypes = new Map<string, Type>();
  private collectedEnums = new Map<string, Enum>();
  private collectedUnions = new Map<string, Union>();
  // Track which TypeSpec types we've already visited to avoid infinite recursion
  private visitedTypes = new Set<TSType>();

  constructor(absoluteSourcePath: string) {
    this.absoluteSourcePath = absoluteSourcePath;
    this.projectDirectory = path.dirname(absoluteSourcePath);
  }

  async parse(): Promise<Service> {
    // Step 1: Compile the TypeSpec file
    this.program = await compile(NodeHost, this.absoluteSourcePath, {
      noEmit: true,
    });

    // Convert compiler diagnostics to violations
    for (const diag of this.program.diagnostics) {
      this.violations.push(
        violations.convertDiagnostic(
          diag as any,
          this.absoluteSourcePath,
          (_target: unknown) => undefined,
        ),
      );
    }

    // If there are compiler errors, return empty service rather than risk garbage IR
    if (this.program.diagnostics.some((d) => d.severity === 'error')) {
      const earlySourceIndex = buildSourceIndex(
        this.program.sourceFiles,
        this.projectDirectory,
      );
      this.sourcePaths = earlySourceIndex.sourcePaths;
      return this.emptyService();
    }

    // Step 2: Build source index
    const sourceIndex = buildSourceIndex(
      this.program.sourceFiles,
      this.projectDirectory,
    );
    this.sourceIndexMap = sourceIndex.sourceIndexMap;
    this.sourcePaths = sourceIndex.sourcePaths;

    // Step 3: Get HTTP services
    const [services, httpDiags] = getAllHttpServices(this.program);
    for (const diag of httpDiags) {
      this.violations.push(
        violations.convertDiagnostic(
          diag as any,
          this.absoluteSourcePath,
          (_target: unknown) => undefined,
        ),
      );
    }

    if (services.length === 0) {
      return this.emptyService();
    }

    const httpService = services[0];
    const namespace = httpService.namespace;

    // Step 4: Extract service metadata
    const serviceDetails = getServiceDetails(this.program, namespace);
    const title = serviceDetails?.title || namespace.name || 'Untitled Service';

    // Extract version
    let majorVersion = 1;
    const version = (serviceDetails as any)?.version;
    if (version) {
      const parsed = parseInt(version, 10);
      if (!isNaN(parsed)) {
        majorVersion = parsed;
      }
    } else {
      this.violations.push(
        violations.missingVersion(
          this.sourcePaths[0] || this.absoluteSourcePath,
        ),
      );
    }

    // Step 5: Extract auth info
    const auth = resolveAuthentication(httpService);
    const defaultSecurity = this.mapAuthentication(auth.defaultAuth);

    // Step 6: Build interfaces from HTTP operations
    const interfaces = this.buildInterfaces(
      httpService.operations,
      defaultSecurity,
    );

    return {
      kind: 'Service',
      basketry: '0.2',
      title: str(title),
      majorVersion: int(majorVersion),
      sourcePaths: this.sourcePaths,
      interfaces,
      types: Array.from(this.collectedTypes.values()),
      enums: Array.from(this.collectedEnums.values()),
      unions: Array.from(this.collectedUnions.values()),
    };
  }

  private emptyService(): Service {
    return {
      kind: 'Service',
      basketry: '0.2',
      title: str('Untitled Service'),
      majorVersion: int(1),
      sourcePaths: this.sourcePaths || [],
      interfaces: [],
      types: [],
      enums: [],
      unions: [],
    };
  }

  private mapAuthentication(authRef: {
    options: ReadonlyArray<{
      all: ReadonlyArray<{ kind: string; auth: HttpAuth }>;
    }>;
  }): SecurityOption[] {
    if (!authRef || !authRef.options) return [];

    return authRef.options
      .map((option) => {
        const schemes: SecurityScheme[] = option.all
          .filter((ref) => ref.kind !== 'noAuth')
          .map((ref) => this.mapHttpAuth(ref.auth));
        return { kind: 'SecurityOption' as const, schemes };
      })
      .filter((opt) => opt.schemes.length > 0);
  }

  private mapHttpAuth(auth: HttpAuth): SecurityScheme {
    if (auth.type === 'http') {
      if ((auth as any).scheme === 'Bearer') {
        return {
          kind: 'BasicScheme',
          type: { value: 'basic' as const },
          name: str(auth.id || 'BearerAuth'),
        };
      }
      return {
        kind: 'BasicScheme',
        type: { value: 'basic' as const },
        name: str(auth.id || 'BasicAuth'),
      };
    }
    if (auth.type === 'apiKey') {
      const apiKeyAuth = auth as any;
      return {
        kind: 'ApiKeyScheme',
        type: { value: 'apiKey' as const },
        name: str(apiKeyAuth.id || 'ApiKeyAuth'),
        parameter: str(apiKeyAuth.name || ''),
        in: { value: apiKeyAuth.in || 'header' },
      };
    }
    if (auth.type === 'oauth2') {
      const oauth2Auth = auth as any;
      return {
        kind: 'OAuth2Scheme',
        type: { value: 'oauth2' as const },
        name: str(oauth2Auth.id || 'OAuth2'),
        flows: (oauth2Auth.flows || []).map((flow: any) =>
          this.mapOAuth2Flow(flow),
        ),
      };
    }
    // Fallback
    return {
      kind: 'BasicScheme',
      type: { value: 'basic' as const },
      name: str(auth.id || 'unknown'),
    };
  }

  private mapOAuth2Flow(flow: any): any {
    const scopes = (flow.scopes || []).map((s: any) => ({
      kind: 'OAuth2Scope',
      name: str(s.value || s.name || ''),
      description: [],
    }));

    switch (flow.type) {
      case 'authorizationCode':
        return {
          kind: 'OAuth2AuthorizationCodeFlow',
          type: { value: 'authorizationCode' as const },
          authorizationUrl: str(flow.authorizationUrl || ''),
          tokenUrl: str(flow.tokenUrl || ''),
          scopes,
        };
      case 'implicit':
        return {
          kind: 'OAuth2ImplicitFlow',
          type: { value: 'implicit' as const },
          authorizationUrl: str(flow.authorizationUrl || ''),
          scopes,
        };
      case 'clientCredentials':
        return {
          kind: 'OAuth2ClientCredentialsFlow',
          type: { value: 'clientCredentials' as const },
          tokenUrl: str(flow.tokenUrl || ''),
          scopes,
        };
      case 'password':
        return {
          kind: 'OAuth2PasswordFlow',
          type: { value: 'password' as const },
          tokenUrl: str(flow.tokenUrl || ''),
          scopes,
        };
      default:
        return {
          kind: 'OAuth2ImplicitFlow',
          type: { value: 'implicit' as const },
          authorizationUrl: str(''),
          scopes,
        };
    }
  }

  private buildInterfaces(
    httpOps: HttpOperation[],
    defaultSecurity: SecurityOption[],
  ): Interface[] {
    // Group operations by their container (interface or namespace)
    const groups = new Map<string, HttpOperation[]>();
    for (const op of httpOps) {
      const container = op.container;
      const name =
        container.kind === 'Interface'
          ? (container as TSInterface).name
          : (container as Namespace).name;
      if (!groups.has(name)) {
        groups.set(name, []);
      }
      groups.get(name)!.push(op);
    }

    const interfaces: Interface[] = [];
    for (const [name, ops] of groups) {
      const methods: Method[] = [];
      const httpRoutes = new Map<string, HttpRoute>();

      for (const op of ops) {
        const method = this.buildMethod(op, defaultSecurity);
        methods.push(method);

        // Build HTTP route info
        const routePattern = op.path;
        if (!httpRoutes.has(routePattern)) {
          httpRoutes.set(routePattern, {
            kind: 'HttpRoute',
            pattern: str(routePattern),
            methods: [],
          });
        }

        const httpMethod = this.buildHttpMethod(op);
        httpRoutes.get(routePattern)!.methods.push(httpMethod);
      }

      interfaces.push({
        kind: 'Interface',
        name: str(name),
        methods,
        protocols: {
          kind: 'InterfaceProtocols',
          http: Array.from(httpRoutes.values()),
        },
      });
    }

    return interfaces;
  }

  private buildMethod(
    op: HttpOperation,
    defaultSecurity: SecurityOption[],
  ): Method {
    const operation = op.operation;
    const loc = this.loc(operation);

    const parameters = this.buildParameters(op);
    const returns = this.buildReturnValue(op);

    // Use operation-level auth if available, otherwise default
    const security = op.authentication
      ? this.mapAuthenticationDirect(op.authentication)
      : defaultSecurity;

    const method: Method = {
      kind: 'Method',
      name: str(operation.name, loc),
      parameters,
      security,
      ...(returns ? { returns } : {}),
      ...(loc ? { loc } : {}),
    };

    return method;
  }

  private mapAuthenticationDirect(auth: Authentication): SecurityOption[] {
    return auth.options
      .map((option) => {
        const schemes: SecurityScheme[] = option.schemes
          .filter((s) => s.type !== 'noAuth')
          .map((s) => this.mapHttpAuth(s));
        return { kind: 'SecurityOption' as const, schemes };
      })
      .filter((opt) => opt.schemes.length > 0);
  }

  private buildParameters(op: HttpOperation): Parameter[] {
    const params: Parameter[] = [];
    const httpProperties = op.parameters.properties;

    for (const httpProp of httpProperties) {
      const prop = httpProp.property;

      if (httpProp.kind === 'cookie') {
        // Emit unsupported feature warning for cookie params
        this.violations.push(
          violations.unsupportedFeature(
            'cookie parameters',
            this.sourcePaths[0] || '',
            {
              start: { line: 1, column: 1, offset: 0 },
              end: { line: 1, column: 1, offset: 0 },
            },
          ),
        );
        continue;
      }

      if (
        httpProp.kind === 'header' ||
        httpProp.kind === 'query' ||
        httpProp.kind === 'path'
      ) {
        const value = this.mapType(prop.type, prop.optional);
        const loc = this.loc(prop);
        params.push({
          kind: 'Parameter',
          name: str(prop.name, loc),
          value,
          ...(loc ? { loc } : {}),
        });
      } else if (httpProp.kind === 'body' || httpProp.kind === 'bodyRoot') {
        // Body parameter - map it as a single "body" parameter
        const value = this.mapType(prop.type, prop.optional);
        const loc = this.loc(prop);
        params.push({
          kind: 'Parameter',
          name: str(prop.name, loc),
          value,
          ...(loc ? { loc } : {}),
        });
      }
    }

    return params;
  }

  private buildReturnValue(op: HttpOperation): ReturnValue | undefined {
    // Find the lowest 2xx success response
    const successResponses = op.responses.filter((r) => {
      if (typeof r.statusCodes === 'number') {
        return r.statusCodes >= 200 && r.statusCodes < 300;
      }
      if (r.statusCodes === '*') return false;
      if (typeof r.statusCodes === 'object' && 'start' in r.statusCodes) {
        return r.statusCodes.start >= 200 && r.statusCodes.start < 300;
      }
      return false;
    });

    if (successResponses.length === 0) return undefined;

    // Sort by status code, pick lowest
    successResponses.sort((a, b) => {
      const codeA =
        typeof a.statusCodes === 'number'
          ? a.statusCodes
          : (a.statusCodes as any).start || 200;
      const codeB =
        typeof b.statusCodes === 'number'
          ? b.statusCodes
          : (b.statusCodes as any).start || 200;
      return codeA - codeB;
    });

    const response = successResponses[0];
    const responseContent = response.responses[0];
    if (!responseContent?.body) return undefined;

    const bodyType = responseContent.body.type;
    if (!bodyType) return undefined;

    // Check for void return type
    if (bodyType.kind === 'Intrinsic' && (bodyType as any).name === 'void') {
      return undefined;
    }

    const value = this.mapType(bodyType, false);
    return { kind: 'ReturnValue', value };
  }

  private buildHttpMethod(op: HttpOperation): HttpMethod {
    const httpParams: HttpParameter[] = [];

    for (const httpProp of op.parameters.properties) {
      if (
        httpProp.kind === 'header' ||
        httpProp.kind === 'query' ||
        httpProp.kind === 'path'
      ) {
        httpParams.push({
          kind: 'HttpParameter',
          name: str(httpProp.property.name),
          location: { kind: 'HttpLocationLiteral', value: httpProp.kind },
        });
      } else if (httpProp.kind === 'body' || httpProp.kind === 'bodyRoot') {
        httpParams.push({
          kind: 'HttpParameter',
          name: str(httpProp.property.name),
          location: { kind: 'HttpLocationLiteral', value: 'body' },
        });
      }
    }

    // Determine success status code
    const successCode = this.getSuccessStatusCode(op);

    // Determine media types
    const requestMediaTypes: StringLiteral[] = [];
    const responseMediaTypes: StringLiteral[] = [];

    // Check if there's a request body
    if (op.parameters.body) {
      const contentTypes = op.parameters.body.contentTypes;
      if (contentTypes && contentTypes.length > 0) {
        for (const ct of contentTypes) {
          requestMediaTypes.push(str(ct));
        }
      } else {
        requestMediaTypes.push(str('application/json'));
      }
    }

    // Check response content types
    for (const resp of op.responses) {
      for (const content of resp.responses) {
        if (content.body) {
          const contentTypes = content.body.contentTypes;
          if (contentTypes && contentTypes.length > 0) {
            for (const ct of contentTypes) {
              if (!responseMediaTypes.some((m) => m.value === ct)) {
                responseMediaTypes.push(str(ct));
              }
            }
          } else {
            if (
              !responseMediaTypes.some((m) => m.value === 'application/json')
            ) {
              responseMediaTypes.push(str('application/json'));
            }
          }
        }
      }
    }

    return {
      kind: 'HttpMethod',
      name: str(op.operation.name),
      verb: { kind: 'HttpVerbLiteral', value: op.verb },
      parameters: httpParams,
      successCode: { kind: 'HttpStatusCodeLiteral', value: successCode },
      requestMediaTypes,
      responseMediaTypes,
    };
  }

  private getSuccessStatusCode(op: HttpOperation): number {
    for (const resp of op.responses) {
      if (
        typeof resp.statusCodes === 'number' &&
        resp.statusCodes >= 200 &&
        resp.statusCodes < 300
      ) {
        return resp.statusCodes;
      }
    }
    // Default based on verb
    if (op.verb === 'post') return 201;
    if (op.verb === 'delete') return 204;
    return 200;
  }

  private mapType(tsType: TSType, optional: boolean): MemberValue {
    // Handle nullable unions: T | null
    if (tsType.kind === 'Union') {
      const union = tsType as TSUnion;
      const variants = Array.from(union.variants.values());
      const nonNullVariants = variants.filter(
        (v) =>
          !(v.type.kind === 'Intrinsic' && (v.type as any).name === 'null'),
      );
      const hasNull = nonNullVariants.length < variants.length;

      if (nonNullVariants.length === 1 && hasNull) {
        // T | null pattern — map as nullable T
        const innerValue = this.mapType(nonNullVariants[0].type, optional);
        if (hasNull) {
          (innerValue as any).isNullable = TRUE_LITERAL;
        }
        return innerValue;
      }

      // Named union (not anonymous nullable)
      if (union.name) {
        this.collectUnion(union);
        const result: ComplexValue = {
          kind: 'ComplexValue',
          typeName: str(union.name),
          rules: [],
        };
        if (optional) result.isOptional = TRUE_LITERAL;
        return result;
      }

      // Anonymous union — use the first variant's type and warn about data loss
      if (nonNullVariants.length > 0) {
        if (nonNullVariants.length > 1) {
          this.violations.push(
            violations.unsupportedFeature(
              `anonymous union with ${nonNullVariants.length} variants (only first variant used)`,
              this.sourcePaths[0] || '',
              {
                start: { line: 1, column: 1, offset: 0 },
                end: { line: 1, column: 1, offset: 0 },
              },
            ),
          );
        }
        return this.mapType(nonNullVariants[0].type, optional);
      }
    }

    // Handle Model (object types and arrays)
    if (tsType.kind === 'Model') {
      const model = tsType as Model;

      // Check if it's an array
      if (isArrayModelType(this.program, model)) {
        const elementType = model.indexer!.value;
        const innerValue = this.mapType(elementType, false);
        (innerValue as any).isArray = TRUE_LITERAL;
        if (optional) (innerValue as any).isOptional = TRUE_LITERAL;
        return innerValue;
      }

      // Named model — collect as Type and return ComplexValue
      if (model.name && !model.name.startsWith('_')) {
        this.collectModel(model);
        const result: ComplexValue = {
          kind: 'ComplexValue',
          typeName: str(model.name, this.loc(model)),
          rules: [],
        };
        if (optional) result.isOptional = TRUE_LITERAL;
        return result;
      }

      // Anonymous model — shouldn't really happen in well-structured TypeSpec
      // but handle gracefully
      return {
        kind: 'PrimitiveValue',
        typeName: { kind: 'PrimitiveLiteral', value: 'untyped' },
        rules: [],
        ...(optional ? { isOptional: TRUE_LITERAL } : {}),
      };
    }

    // Handle Scalar
    if (tsType.kind === 'Scalar') {
      return this.mapScalarType(tsType as Scalar, optional);
    }

    // Handle Enum
    if (tsType.kind === 'Enum') {
      const tsEnum = tsType as TSEnum;
      this.collectEnum(tsEnum);
      const result: ComplexValue = {
        kind: 'ComplexValue',
        typeName: str(tsEnum.name, this.loc(tsEnum)),
        rules: [],
      };
      if (optional) result.isOptional = TRUE_LITERAL;
      return result;
    }

    // Handle Intrinsic types
    if (tsType.kind === 'Intrinsic') {
      const name = (tsType as any).name;
      if (name === 'void' || name === 'never') {
        return {
          kind: 'PrimitiveValue',
          typeName: { kind: 'PrimitiveLiteral', value: 'untyped' },
          rules: [],
        };
      }
      if (name === 'null') {
        return {
          kind: 'PrimitiveValue',
          typeName: { kind: 'PrimitiveLiteral', value: 'null' },
          rules: [],
        };
      }
    }

    // Fallback
    return {
      kind: 'PrimitiveValue',
      typeName: { kind: 'PrimitiveLiteral', value: 'untyped' },
      rules: [],
      ...(optional ? { isOptional: TRUE_LITERAL } : {}),
    };
  }

  private mapScalarType(scalar: Scalar, optional: boolean): PrimitiveValue {
    // Resolve the scalar name (walk base scalars for custom scalars)
    let resolvedName = scalar.name;
    let current: Scalar | undefined = scalar;
    while (current && !isKnownScalar(resolvedName)) {
      current = current.baseScalar;
      if (current) resolvedName = current.name;
    }

    const mapping = mapScalar(resolvedName);

    if (mapping.coerced) {
      this.violations.push(
        violations.typeCoercion(
          resolvedName,
          mapping.primitive,
          this.sourcePaths[0] || '',
          {
            start: { line: 1, column: 1, offset: 0 },
            end: { line: 1, column: 1, offset: 0 },
          },
        ),
      );
    }

    const result: PrimitiveValue = {
      kind: 'PrimitiveValue',
      typeName: { kind: 'PrimitiveLiteral', value: mapping.primitive as any },
      rules: mapping.rules as any[],
    };

    if (optional) result.isOptional = TRUE_LITERAL;

    return result;
  }

  private collectModel(model: Model): void {
    if (!model.name || this.collectedTypes.has(model.name)) return;
    if (this.visitedTypes.has(model)) return;
    this.visitedTypes.add(model);

    const properties: Property[] = [];

    // Flatten base model properties
    if (model.baseModel) {
      this.collectModelProperties(model.baseModel, properties);
    }

    // Collect own properties
    this.collectModelProperties(model, properties);

    const loc = this.loc(model);
    const type: Type = {
      kind: 'Type',
      name: str(model.name, loc),
      properties,
      rules: [],
      ...(loc ? { loc } : {}),
    };

    this.collectedTypes.set(model.name, type);
  }

  private collectModelProperties(model: Model, properties: Property[]): void {
    for (const [, prop] of model.properties) {
      // Don't duplicate properties from base model
      if (properties.some((p) => p.name.value === prop.name)) continue;

      const value = this.mapType(prop.type, prop.optional);
      const loc = this.loc(prop);
      properties.push({
        kind: 'Property',
        name: str(prop.name, loc),
        value,
        ...(loc ? { loc } : {}),
      });
    }
  }

  private collectEnum(tsEnum: TSEnum): void {
    if (this.collectedEnums.has(tsEnum.name)) return;

    let hasNumeric = false;
    const members: EnumMember[] = [];
    for (const [, member] of tsEnum.members) {
      let content: string;
      if (typeof member.value === 'number') {
        hasNumeric = true;
        content = String(member.value);
      } else if (typeof member.value === 'string') {
        content = member.value;
      } else {
        content = member.name;
      }

      const memberLoc = this.loc(member);
      members.push({
        kind: 'EnumMember',
        content: str(content, memberLoc),
        ...(memberLoc ? { loc: memberLoc } : {}),
      });
    }

    if (hasNumeric) {
      this.violations.push(
        violations.numericEnum(tsEnum.name, this.sourcePaths[0] || '', {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 1, offset: 0 },
        }),
      );
    }

    const loc = this.loc(tsEnum);
    this.collectedEnums.set(tsEnum.name, {
      kind: 'Enum',
      name: str(tsEnum.name, loc),
      members,
      ...(loc ? { loc } : {}),
    });
  }

  private collectUnion(union: TSUnion): void {
    if (!union.name || this.collectedUnions.has(union.name)) return;

    const variants = Array.from(union.variants.values());
    const members: MemberValue[] = variants.map((v) =>
      this.mapType(v.type, false),
    );

    const loc = this.loc(union);
    this.collectedUnions.set(union.name, {
      kind: 'SimpleUnion',
      name: str(union.name, loc),
      members,
      ...(loc ? { loc } : {}),
    });
  }

  private loc(node: any): string | undefined {
    try {
      if (!node?.node) return undefined;
      return encodeLoc(this.sourceIndexMap, node);
    } catch {
      return undefined;
    }
  }
}
