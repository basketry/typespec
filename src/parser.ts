import { Enum, Interface, Service, Type, Union, Violation } from "basketry";
import { compileProgram, getOpenApi3 } from "./compile";
import { getTypeName, isDeprecated, Namespace } from "@typespec/compiler";
import { getAllHttpServices, getRoutePath } from "@typespec/http";

export class TypeSpecParser {
	constructor(
		private schema: string,
		private readonly sourcePath: string,
	) {
		this.schema = schema;
	}

	public readonly violations: Violation[] = [];

	async parse(): Promise<{
		service: Service;
		violations: Violation[];
	}> {
    const program = await compileProgram(this.schema);
		const service = await getOpenApi3(program);

		type Stuff = Pick<Service, "interfaces" | "types" | "enums" | "unions">;
		const things: Array<Stuff> = [];
		const traverseNamespaces = (namespace: Namespace) => {
			if (namespace.namespaces.size > 0) {
				for (const [, nestedNamespace] of namespace.namespaces) {
					traverseNamespaces(nestedNamespace);
				}
			}

			const interfaces: Interface[] = [];
			const types: Type[] = [];
			const enums: Enum[] = [];
			const unions: Union[] = [];

const [services] = getAllHttpServices(program);

      services.map(service => {
        service.operations.map(operation => {
          return {

          }
      });
      
      for (const [_, union] of namespace.unions) {
        unions.push({
          kind: "Union",
          name: { value: getTypeName(union) },
          discriminator: { value: "kind" },
          members: Array.from(union.variants.values()).map(variant => ({
            typeName: { value: getTypeName(variant) },
            isArray: false,
            isPrimitive: false,
            rules: []
          }))
        });
      }
      
      for (const [_, enum_] of namespace.enums) {
        enums.push({
          kind: "Enum",
          name: { value: getTypeName(enum_) },
          values: Array.from(enum_.members.values()).map(member => ({
            kind: "EnumValue",
            name: { value: member.name },
            content: { value: member.name }
          }))
        });
      }
      
      for (const [_, model] of namespace.models) {
          const isTypeDeprecated = isDeprecated(program, model);
        types.push({
          kind: "Type",
          name: { value: getTypeName(model) },
          rules: [],
          properties: Array.from(model.properties.values()).map(property => ({
              ...property,
              name: {
              value: property.name,
              // TODO: loc
              },
              kind: "Property"
            })),
            // TODO: get loc from mode.node?
          ...(isTypeDeprecated ? { deprecated: { value: true, loc: undefined } } : {}),
        });
      }

		});
		for (const [name, namespace] of service.type.namespaces) {
			const name = getTypeName(namespace);
		}

		return {
			service: {
				// Contant values
				kind: "Service",
				basketry: "1.1-rc",
				sourcePath: this.sourcePath,

				// TODO: parse from schema input
				title: { value: "TODO" },
				majorVersion: { value: 1 },
				interfaces: [],
				types,
				enums,
				unions,
			},
			violations: this.violations,
		};
	}
}
