import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { format } from 'prettier';
import parser from '..';

createSnapshot(
  join(process.cwd(), 'src', 'snapshot', 'example.tsp'),
  join(process.cwd(), 'src', 'snapshot', 'snapshot.json'),
);

function createSnapshot(source: string, destination: string): void {
  const schema = readFileSync(source).toString('utf8');
  const prettierOptions = JSON.parse(
    readFileSync(join(process.cwd(), '.prettierrc')).toString('utf8'),
  );
  const { service, violations } = parser(schema, 'snapshot/example.tsp');
  const snapshot = format(
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
