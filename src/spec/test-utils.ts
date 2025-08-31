import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { v4 } from 'uuid';
import { TypespecParser } from '../parser.js';
import { ParseResult } from '@basketry/ir';

export async function parse(tsp: string): Promise<ParseResult> {
  const tmpDir = os.tmpdir();
  const filePath = path.join(tmpDir, `basketry-typespec-testcase-${v4()}.tsp`);

  try {
    await fs.writeFile(filePath, tsp);

    const parser = await TypespecParser.create(
      {
        sourcePath: filePath,
        sourceContent: tsp,
      },
      {
        projectDirectory: path.dirname(filePath),
      },
    );

    if (!parser) return { violations: [] };

    return await parser.parse();
  } finally {
    await fs.unlink(filePath);
  }
}

export function expectDefined<T>(
  value: T | undefined | null,
): asserts value is T {
  expect(value).toBeDefined();
}
