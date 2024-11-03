import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import {
	compile,
	CompilerHost,
	createChecker,
	createSourceFile,
	getSourceFileKindFromExt,
	joinPaths,
	Service,
} from "@typespec/compiler";
import { fs } from "memfs";
import { getOpenAPI3 } from "@typespec/openapi3";
import appRootPath from "app-root-path";

const { readFile, writeFile, readdir, mkdir, rm, stat } = fs.promises;

const readUtf8File = async (path: string): Promise<string> => {
	const buffer = await readFile(path);
	const len = buffer.length;
	if (len >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
		throw new Error("UTF-16 BE");
	}
	if (len >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
		throw new Error("UTF-16 LE");
	}
	if (
		len >= 3 &&
		buffer[0] === 0xef &&
		buffer[1] === 0xbb &&
		buffer[2] === 0xbf
	) {
		// UTF-8 byte order mark detected
		return buffer.toString("utf8", 3);
	}
	// Default is UTF-8 with no byte order mark
	return buffer.toString("utf8");
};

const realpath = async (p: string) => {
	let currentPath = path.resolve(p);
	let stat: any;
	try {
		stat = fs.lstatSync(currentPath);
	} catch (err) {
		throw new Error(`Path does not exist: ${currentPath}`);
	}

	if (stat.isSymbolicLink()) {
		const linkTarget = fs.readlinkSync(currentPath);
		currentPath = path.resolve(
			path.dirname(currentPath),
			linkTarget.toString(),
		);
		return realpath(currentPath); // recursively resolve if needed
	}

	return currentPath;
};

export const VirtualHost: CompilerHost = {
	readFile: async (path: string) =>
		createSourceFile(await readUtf8File(path), path),
	writeFile: (path: string, content: string) =>
		writeFile(path, content, { encoding: "utf-8" }),
	readDir: async (path: string) => {
		const res = await readdir(path);
		return res.map((p: any) => p.toString());
	},
	readUrl: async (url: string) => {
		const response = await fetch(url, { redirect: "follow" });
		const text = await response.text();
		return createSourceFile(text, response.url);
	},
	getLibDirs() {
		const rootDir = this.getExecutionRoot();
		return [joinPaths(rootDir, "lib/std")];
	},
	getJsImport: (path) => import(pathToFileURL(path).href),
	rm,
	mkdirp: (path: string) => mkdir(path, { recursive: true }),
	stat,
	realpath,
	getSourceFileKind: getSourceFileKindFromExt,
	getExecutionRoot: () => appRootPath.resolve(fileURLToPath(import.meta.url)),
	fileURLToPath,
	pathToFileURL: (path) => pathToFileURL(path).href,
	logSink: {
		log: console.log,
	},
};

export const getOpenApi3 = async (sourceCode: string): Promise<Service> => {
	// NOTE: This is an absolute path: memfs doesn't really handle
	//  relative paths
	const sourceFilePath = "/source.tsp";
	const _virtualSourceFile = await writeFile(sourceFilePath, sourceCode);
	const program = await compile(VirtualHost, sourceFilePath, {
		emit: ["@typespec/openapi3"],
	});

	console.log(program);
	const [openapi3] = await getOpenAPI3(program);

	return openapi3.service;
};

getOpenApi3(`
/** This is an example doc-string let's goooo */
import "@typespec/http";

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

@route("/pets")
namespace Pets {
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
	.then((service) => {
		console.log("yay");
		console.log(service);
	})
	.catch(console.error);
