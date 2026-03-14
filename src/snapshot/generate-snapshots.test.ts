import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { format } from 'prettier';
import parser from '../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createSnapshot(
  source: string,
  destination: string,
): Promise<void> {
  const prettierOptions = JSON.parse(
    readFileSync(path.join(__dirname, '..', '..', '.prettierrc')).toString(
      'utf8',
    ),
  );
  const { service, violations } = await parser('', source);
  const snapshot = await format(
    JSON.stringify(service, (key, value) =>
      key === 'loc' ? undefined : value,
    ),
    {
      ...prettierOptions,
      parser: 'json',
    },
  );
  writeFileSync(destination, snapshot);
  for (const violation of violations) console.warn(violation);
}

describe('snapshot generation', () => {
  it('generates petstore snapshot', async () => {
    await createSnapshot(
      path.join(__dirname, 'petstore', 'main.tsp'),
      path.join(__dirname, 'petstore-snapshot.json'),
    );
    const snapshot = JSON.parse(
      readFileSync(path.join(__dirname, 'petstore-snapshot.json')).toString(),
    );
    expect(snapshot).toBeDefined();
    expect(snapshot.kind).toBe('Service');
  });

  it('generates example snapshot', async () => {
    await createSnapshot(
      path.join(__dirname, 'example', 'main.tsp'),
      path.join(__dirname, 'example-snapshot.json'),
    );
    const snapshot = JSON.parse(
      readFileSync(path.join(__dirname, 'example-snapshot.json')).toString(),
    );
    expect(snapshot).toBeDefined();
    expect(snapshot.kind).toBe('Service');
  });
});
