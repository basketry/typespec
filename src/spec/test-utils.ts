import * as fs from 'fs/promises';
import * as path from 'path';

import { ParseResult } from '@basketry/ir';
import { v4 } from 'uuid';

import { TypespecParser } from '../parser.js';

export async function parse(tsp: string): Promise<ParseResult> {
  const tmpDir = './tmp';
  const filePath = path.join(tmpDir, `basketry-typespec-testcase-${v4()}.tsp`);
  await fs.mkdir(tmpDir, { recursive: true });

  const absoluteSourcePath = path.resolve(filePath);

  try {
    await fs.writeFile(absoluteSourcePath, tsp);

    const parser = await TypespecParser.create(
      {
        sourcePath: absoluteSourcePath,
        sourceContent: tsp,
      },
      {
        projectDirectory: path.dirname(absoluteSourcePath),
      },
    );

    if (!parser) return { violations: [] };

    return await parser.parse();
  } finally {
    await fs.unlink(absoluteSourcePath);
  }
}

export function expectDefined<T>(
  value: T | undefined | null,
): asserts value is T {
  expect(value).toBeDefined();
}
