import path = require("path");
import appRootPath = require("app-root-path");
import { fileURLToPath, pathToFileURL } from "url";
import {
	compile,
	CompilerHost,
	createSourceFile,
	getSourceFileKindFromExt,
	joinPaths,
} from "@typespec/compiler";
import {
	CompilerPackageRoot,
	InvalidEncodingError,
} from "@typespec/compiler/dist/src/core/node-host";
import { fs } from "memfs";
import { TDataOut } from "memfs/lib/encoding";
import { IDirent } from "memfs/lib/node/types/misc";
import { createConsoleSink } from "@typespec/compiler/dist/src/core/logger/console-sink";
import { getOpenAPI3 } from "@typespec/openapi3";
import { OpenAPI3ServiceRecord } from "@typespec/openapi3/dist/src/types";

const { readFile, writeFile, readdir, mkdir, rm, stat } = fs.promises;

const readUtf8File = async (path: string): Promise<string> => {
	const buffer = await readFile(path);
	const len = buffer.length;
	if (len >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
		throw new InvalidEncodingError("UTF-16 BE");
	}
	if (len >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
		throw new InvalidEncodingError("UTF-16 LE");
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
		return res.map((p: TDataOut | IDirent) => p.toString());
	},
	readUrl: async (url: string) => {
		const response = await fetch(url, { redirect: "follow" });
		const text = response.text();
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
	getExecutionRoot: () => CompilerPackageRoot,
	fileURLToPath,
	pathToFileURL: (path) => pathToFileURL(path).href,
	logSink: createConsoleSink(),
};

export const getOpenApi3 = async (
	sourceCode: string,
): Promise<OpenAPI3ServiceRecord> => {
	const sourceFilePath = "./source.tsp";
	const _virtualSourceFile = await writeFile(sourceFilePath, sourceCode);
	const program = await compile(VirtualHost, sourceFilePath, {
		emit: ["@typespec/openapi3"],
	});

	const [openapi3] = await getOpenAPI3(program);

	return openapi3;
};
