import { readFileSync } from 'fs';
import { join } from 'path';
import * as https from 'https';

import { ReturnType, Service, validate } from 'basketry';
import parser from '.';

function noSource(service: Service): Omit<Service, 'sourcePath'> {
  const { sourcePath, ...rest } = service;
  return rest;
}

describe('parser', () => {
  it('recreates a valid snapshot', () => {
    // ARRANGE
    const snapshot = JSON.parse(
      readFileSync(join('src', 'snapshot', 'snapshot.json')).toString(),
    );

    const sourcePath: string = join('src', 'snapshot', 'example.tsp');
    const sourceContent = readFileSync(sourcePath).toString();

    // ACT
    const result = JSON.parse(
      JSON.stringify(parser(sourceContent, sourcePath).service, removeLoc),
    );

    // ASSERT
    expect(noSource(result)).toStrictEqual(noSource(snapshot));
  });

  it('creates a type for every custom typeName', () => {
    // ARRANGE

    const sourcePath = join('src', 'snapshot', 'example.tsp');
    const sourceContent = readFileSync(sourcePath).toString();

    // ACT
    const result = parser(sourceContent, sourcePath).service;

    // ASSERT
    const fromMethodParameters = new Set(
      result.interfaces
        .map((i) => i.methods)
        .reduce((a, b) => a.concat(b), [])
        .map((i) => i.parameters)
        .reduce((a, b) => a.concat(b), [])
        .filter((p) => !p.isPrimitive)
        .map((p) => p.typeName.value),
    );

    const fromMethodReturnTypes = new Set(
      result.interfaces
        .map((i) => i.methods)
        .reduce((a, b) => a.concat(b), [])
        .map((i) => i.returnType)
        .filter((t): t is ReturnType => !!t)
        .filter((p) => !p.isPrimitive)
        .map((p) => p.typeName.value),
    );

    const fromTypes = new Set(
      result.types
        .map((t) => t.properties)
        .reduce((a, b) => a.concat(b), [])
        .filter((p) => !p.isPrimitive)
        .map((p) => p.typeName.value),
    );

    const typeNames = new Set([
      ...result.types.map((t) => t.name.value),
      ...result.unions.map((t) => t.name.value),
      ...result.enums.map((e) => e.name.value),
    ]);

    for (const localTypeName of [
      ...fromMethodParameters,
      ...fromMethodReturnTypes,
      ...fromTypes,
    ]) {
      expect(typeNames.has(localTypeName)).toEqual(true);
    }
  });

  it('creates types with unique names', () => {
    // ARRANGE

    const sourcePath = join('src', 'snapshot', 'example.tsp');
    const sourceContent = readFileSync(sourcePath).toString();

    // ACT
    const result = parser(sourceContent, sourcePath).service;

    // ASSERT
    const typeNames = result.types.map((t) => t.name);

    expect(typeNames.length).toEqual(new Set(typeNames).size);
  });

  it('creates a valid service', () => {
    // ARRANGE
    const sourcePath = join('src', 'snapshot', 'example.tsp');
    const sourceContent = readFileSync(sourcePath).toString();

    const service = parser(sourceContent, sourcePath).service;

    // ACT
    const errors = validate(service).errors;

    // ASSERT
    expect(errors).toEqual([]);
  });
});

function getText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data: string = '';

        res.on('data', (d) => {
          data += d.toString();
        });

        res.on('end', () => {
          resolve(data);
        });
      })
      .on('error', (e) => {
        reject(e);
      });
  });
}

function removeLoc(key: string, value: any): any {
  return key === 'loc' ? undefined : value;
}
