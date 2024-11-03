import { Service, Violation } from "basketry";
import { getOpenApi3 } from "./compile";

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
		const service = await getOpenApi3(this.schema);

		const models = [];
		for (const [name, namespace] of service.type.namespaces) {
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
