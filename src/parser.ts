import { Enum, Interface, Service, Type, Union, Violation } from "basketry";
import { compileProgram, getOpenApi3 } from "./compile";
import { getTypeName, Namespace } from "@typespec/compiler";
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
			namespace.unions.forEach((union) => {
				unions.push(union);
			});
			namespace.enums.forEach((enum_) => {
				enums.push(enum_);
			});
			namespace.models.forEach((model) => {
				types.push(model);
			});
		};
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
				types: [],
				enums: [],
				unions: [],
			},
			violations: this.violations,
		};
	}
}
