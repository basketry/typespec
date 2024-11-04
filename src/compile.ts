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
	// NOTE: This is an absolute path: memfs doesn't really handle
	//  relative paths
	const sourceFilePath = "./tmp/main.tsp";
	await mkdir("./tmp", { recursive: true });
	const _virtualSourceFile = await writeFile(sourceFilePath, sourceCode);
	const program = await compile(NodeHost, sourceFilePath, {
		emit: ["@typespec/openapi3"],
	});

	return program;
};
export const getOpenApi3 = async (program: Program): Promise<Service> => {
	const [openapi3] = await getOpenAPI3(program);

	return openapi3.service;
};

compileProgram(`
/** This is an example doc-string let's goooo */
import "@typespec/http";
/*
* imports are not supported yet
* import "./Banana.tsp";
*/

using TypeSpec.Http;

@service({
  title: "Pet Store",
})
@server("https://example.com", "Single server endpoint")
namespace PetStore;

model Pet {
  id: int32;

  @minLength(1)
  name: string;

  @minValue(0)
  @maxValue(100)
  age: int32;

  kind: petType;
}

enum petType {
  dog: "dog",
  cat: "cat",
  fish: "fish",
  bird: "bird",
  reptile: "reptile",
}

interface WritePet {
  write(pet: Pet): void;
}

@route("/pets")
namespace Pets {
  model Pet {
    name: string;
  }

  enum petType {
    dog: "dog",
  }


  @doc("""
    List all pets
    
    This is multiline because that is good
  """)
  @get
  op listPets(): {
    @statusCode statusCode: 200;
    // For some reason the array types are not being resolved correctly
    //  and throwing a 'declarations' undefined error
    @body pets: Pet;
  };

  @get
  op getPet(@path petId: int32): {
    @statusCode statusCode: 200;
    @body pet: Pet;
  };

  @post
  op createPet(@body pet: Pet): {
    @statusCode statusCode: 201;
    @body newPet: Pet;
  };

  @put
  op updatePet(@path petId: int32, @body pet: Pet): {
    @statusCode statusCode: 200;
    @body updatedPet: Pet;
  };

  @delete
  op deletePet(@path petId: int32): {
    @statusCode statusCode: 204;
  };
}
`)
	.then((program) => {
		const [services] = getAllHttpServices(program);
		console.log(services[0].operations);
		console.log(getDoc(program, services[0].operations[0].operation));
		getOpenApi3(program)
			.then((service) => {
				console.log("yay");
				// console.log(service);
				// console.log(service.type.interfaces);
				// console.log(service.type.namespaces.get("Pets").decorators);
			})
			.catch(console.error);
	})
	.catch(console.error);
