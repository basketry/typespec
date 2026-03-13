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

type SourceFile = {
  path: string;
  text: string;
};

type AstNode = {
  pos: number;
  end: number;
  file?: SourceFile;
  parent?: AstNode;
};

type LocNode = {
  node?: AstNode;
};

/**
 * Walks up the TypeSpec AST parent chain to find the source file for a node.
 * TypeSpec AST nodes may not have a direct .file property — it's often on an ancestor.
 */
function findSourceFile(
  astNode: AstNode,
  maxDepth = 10,
): SourceFile | undefined {
  let current: AstNode | undefined = astNode;
  let depth = 0;
  while (current && depth < maxDepth) {
    if (current.file) return current.file;
    current = current.parent;
    depth++;
  }
  return undefined;
}

/**
 * Encodes a TypeSpec type node's source location into Basketry's loc string format.
 * Returns undefined if no .node or if the file path is not in the sourceIndexMap.
 * TypeSpec AST nodes may have the file on an ancestor node, so we walk the parent chain.
 */
export function encodeLoc(
  sourceIndexMap: Map<string, number>,
  node: LocNode,
): string | undefined {
  if (!node.node) return undefined;

  const { pos, end } = node.node;
  const file = findSourceFile(node.node);
  if (!file) return undefined;

  const sourceIndex = sourceIndexMap.get(file.path);

  if (sourceIndex === undefined) return undefined;

  const range: Range = {
    start: offsetToPosition(file.text, pos),
    end: offsetToPosition(file.text, end),
  };

  return encodeRange(sourceIndex, range);
}
