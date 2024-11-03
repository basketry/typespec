import { Parser } from "basketry";
import { TypeSpecParser } from "./parser";

const parser: Parser = (input, sourcePath) => {
	const tspParser = new TypeSpecParser(input, sourcePath);
	const service = tspParser.parse();
	const violations = tspParser.violations;
	return { service, violations };
};

export default parser;
