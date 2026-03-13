import { Parser } from 'basketry';
import { TypeSpecParser } from './parser';

const parse: Parser = async (_sourceContent, absoluteSourcePath) => {
  const parser = new TypeSpecParser(absoluteSourcePath);
  const service = await parser.parse();
  return { service, violations: parser.violations };
};

export default parse;
