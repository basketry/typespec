import { suite, test } from "node:test";
import { fs } from "memfs";
import { VirtualHost } from "./compile.ts";
import assert from "node:assert";

const { writeFile, readFile } = fs;

suite("VirtualHost", () => {
	test("it can write a file and read it back", async () => {
		await VirtualHost.writeFile("/test.txt", "Hello World!");
		const sourceFile = await VirtualHost.readFile("/test.txt");
		assert.strictEqual(sourceFile.text, "Hello World!");
	});

	test("it can create a directory and list the files", async () => {
		const dirFiles = ["file1.txt", "file2.txt", "file3.txt"];
		await VirtualHost.mkdirp("test/dir");
		for (let i = 0; i < dirFiles.length; i++) {
			await VirtualHost.writeFile(
				`test/dir/${dirFiles[i]}`,
				`test content ${i}`,
			);
		}

		const files = await VirtualHost.readDir("test/dir");
		assert.deepStrictEqual(files, dirFiles);
	});
});
