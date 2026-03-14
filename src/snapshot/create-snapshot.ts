import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { format } from 'prettier';
import parser from '../index.js';

createSnapshot(
  join(process.cwd(), 'src', 'snapshot', 'petstore', 'main.tsp'),
  join(process.cwd(), 'src', 'snapshot', 'petstore-snapshot.json'),
);

createSnapshot(
  join(process.cwd(), 'src', 'snapshot', 'example', 'main.tsp'),
  join(process.cwd(), 'src', 'snapshot', 'example-snapshot.json'),
);

async function createSnapshot(
  source: string,
  destination: string,
): Promise<void> {
  const prettierOptions = JSON.parse(
    readFileSync(join(process.cwd(), '.prettierrc')).toString('utf8'),
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
