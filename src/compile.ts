import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import {
	compile,
	CompilerHost,
	createChecker,
	createSourceFile,
	getDoc,
	getSourceFileKindFromExt,
	getTypeName,
	joinPaths,
	NodeHost,
	Program,
	Service,
} from "@typespec/compiler";
import { getOpenAPI3 } from "@typespec/openapi3";
import { mkdir, writeFile } from "fs/promises";
import { getAllHttpServices } from "@typespec/http";

export const compileProgram = async (sourceCode: string): Promise<Program> => {
	const sourceFilePath = "./tmp/main.tsp";
	await mkdir("./tmp", { recursive: true });
	// const _virtualSourceFile = await writeFile(sourceFilePath, sourceCode);
	const program = await compile(NodeHost, sourceFilePath, {
		emit: ["@typespec/openapi3"],
	});

	return program;
};
export const getOpenApi3 = async (program: Program): Promise<Service> => {
	const [openapi3] = await getOpenAPI3(program);

	return openapi3.service;
};

compileProgram("")
	.then((program) => {
		const [services] = getAllHttpServices(program);
		console.log(services[0].operations);
		console.log(getDoc(program, services[0].operations[0].operation));
		getOpenApi3(program)
			.then((service) => {
				console.log("yay");
				console.log(service);
				console.log(getAllHttpServices(program)[0][0].operations);
				// console.log(service.type.interfaces);
				// console.log(service.type.namespaces.get("Pets").decorators);
			})
			.catch(console.error);
	})
	.catch(console.error);
