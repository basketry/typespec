import { encodeRange, Range } from 'basketry';
import * as path from 'path';

export interface SourceIndex {
  sourcePaths: string[];
  sourceIndexMap: Map<string, number>;
}

/**
 * Builds a SourceIndex from the TypeSpec compiler's program.sourceFiles map.
 * Filters out node_modules, converts paths to relative, sorts alphabetically.
 */
export function buildSourceIndex(
  sourceFiles: Map<string, unknown>,
  projectDirectory: string,
): SourceIndex {
  const absolutePaths = Array.from(sourceFiles.keys()).filter(
    (p) => !p.includes('node_modules'),
  );

  const relativePaths = absolutePaths.map((p) =>
    path.relative(projectDirectory, p),
  );

  // Sort and track original absolute paths
  const pairs = absolutePaths
    .map((abs, i) => ({ abs, rel: relativePaths[i] }))
    .sort((a, b) => a.rel.localeCompare(b.rel));

  const sourcePaths = pairs.map((p) => p.rel);
  const sourceIndexMap = new Map<string, number>();
  for (let i = 0; i < pairs.length; i++) {
    sourceIndexMap.set(pairs[i].abs, i);
  }

  return { sourcePaths, sourceIndexMap };
}

/**
 * Computes a 1-based line and 1-based column from a 0-based character offset.
 */
export function offsetToPosition(
  text: string,
  offset: number,
): { line: number; column: number; offset: number } {
  let line = 1;
  let lastNewline = -1;

  for (let i = 0; i < offset; i++) {
    if (text[i] === '\n') {
      line++;
      lastNewline = i;
    }
  }

  const column = offset - lastNewline;

  return { line, column, offset };
}

type LocNode = {
  node?: {
    pos: number;
    end: number;
    file: {
      path: string;
      text: string;
    };
  };
};

/**
 * Encodes a TypeSpec type node's source location into Basketry's loc string format.
 * Returns undefined if no .node or if the file path is not in the sourceIndexMap.
 */
export function encodeLoc(
  sourceIndexMap: Map<string, number>,
  node: LocNode,
): string | undefined {
  if (!node.node) return undefined;

  const { pos, end, file } = node.node;
  const sourceIndex = sourceIndexMap.get(file.path);

  if (sourceIndex === undefined) return undefined;

  const range: Range = {
    start: offsetToPosition(file.text, pos),
    end: offsetToPosition(file.text, end),
  };

  return encodeRange(sourceIndex, range);
}
