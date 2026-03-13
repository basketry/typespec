import { buildSourceIndex, encodeLoc, offsetToPosition } from './location';

describe('buildSourceIndex', () => {
  it('builds correct sourcePaths and sourceIndexMap from mock file paths', () => {
    const projectDirectory = '/project';
    const sourceFiles = new Map<string, unknown>([
      ['/project/b.tsp', {}],
      ['/project/a.tsp', {}],
      ['/project/c.tsp', {}],
    ]);

    const result = buildSourceIndex(sourceFiles, projectDirectory);

    expect(result.sourcePaths).toEqual(['a.tsp', 'b.tsp', 'c.tsp']);
    expect(result.sourceIndexMap.get('/project/a.tsp')).toBe(0);
    expect(result.sourceIndexMap.get('/project/b.tsp')).toBe(1);
    expect(result.sourceIndexMap.get('/project/c.tsp')).toBe(2);
  });

  it('filters out node_modules paths', () => {
    const projectDirectory = '/project';
    const sourceFiles = new Map<string, unknown>([
      ['/project/a.tsp', {}],
      ['/project/node_modules/@typespec/http/lib/http.tsp', {}],
      ['/project/b.tsp', {}],
    ]);

    const result = buildSourceIndex(sourceFiles, projectDirectory);

    expect(result.sourcePaths).toEqual(['a.tsp', 'b.tsp']);
    expect(result.sourceIndexMap.size).toBe(2);
    expect(
      result.sourceIndexMap.has(
        '/project/node_modules/@typespec/http/lib/http.tsp',
      ),
    ).toBe(false);
  });
});

describe('offsetToPosition', () => {
  const text = 'hello\nworld\nfoo';
  // offsets:  0-4=hello, 5=\n, 6-10=world, 11=\n, 12-14=foo

  it('computes position at beginning of file', () => {
    const pos = offsetToPosition(text, 0);
    expect(pos).toEqual({ line: 1, column: 1, offset: 0 });
  });

  it('computes position at end of first line', () => {
    const pos = offsetToPosition(text, 4);
    expect(pos).toEqual({ line: 1, column: 5, offset: 4 });
  });

  it('computes position at start of second line', () => {
    const pos = offsetToPosition(text, 6);
    expect(pos).toEqual({ line: 2, column: 1, offset: 6 });
  });

  it('computes position in middle of third line', () => {
    const pos = offsetToPosition(text, 13);
    expect(pos).toEqual({ line: 3, column: 2, offset: 13 });
  });
});

describe('encodeLoc', () => {
  const sourceIndexMap = new Map<string, number>([
    ['/project/a.tsp', 0],
    ['/project/b.tsp', 1],
  ]);

  it('returns undefined when node has no .node property', () => {
    const result = encodeLoc(sourceIndexMap, {});
    expect(result).toBeUndefined();
  });

  it('returns undefined when file path not in sourceIndexMap', () => {
    const result = encodeLoc(sourceIndexMap, {
      node: {
        pos: 0,
        end: 5,
        file: {
          path: '/project/unknown.tsp',
          text: 'hello',
        },
      },
    });
    expect(result).toBeUndefined();
  });

  it('returns an encoded string when given a valid node', () => {
    const result = encodeLoc(sourceIndexMap, {
      node: {
        pos: 0,
        end: 5,
        file: {
          path: '/project/a.tsp',
          text: 'hello world',
        },
      },
    });
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    // The format is "<sourceIndex>:..." so it should start with "0:"
    expect(result).toMatch(/^0:/);
  });
});
