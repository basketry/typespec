import { encodeRange } from 'basketry';
import { SourceLocation } from '@typespec/compiler';

export class SourcePathState {
  constructor(absoluteSourcePath: string) {
    this._sourcePaths.push(absoluteSourcePath);
  }

  private readonly _sourcePaths: string[] = [];
  public get sourcePaths(): ReadonlyArray<string> {
    return this._sourcePaths;
  }

  getEncodedRange(
    sourceLocation: SourceLocation | undefined,
  ): string | undefined {
    if (!sourceLocation) return undefined;

    const sourcePath = sourceLocation.file.path;

    const getSourceIndex = () => {
      const i = this._sourcePaths.indexOf(sourcePath);
      if (i > -1) {
        return i;
      } else {
        this._sourcePaths.push(sourcePath);
        return this._sourcePaths.length - 1;
      }
    };

    return encodeRange(getSourceIndex(), {
      start: {
        offset: sourceLocation.pos,
        line:
          sourceLocation.file.getLineAndCharacterOfPosition(sourceLocation.pos)
            .line + 1,
        column:
          sourceLocation.file.getLineAndCharacterOfPosition(sourceLocation.pos)
            .character + 1,
      },
      end: {
        offset: sourceLocation.end,
        line:
          sourceLocation.file.getLineAndCharacterOfPosition(sourceLocation.end)
            .line + 1,
        column:
          sourceLocation.file.getLineAndCharacterOfPosition(sourceLocation.end)
            .character + 1,
      },
    });
  }
}
