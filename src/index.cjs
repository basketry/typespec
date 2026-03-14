// CJS wrapper for Basketry's NodeEngine which loads parsers via require().
// The actual parser is ESM (required by @typespec/compiler), so we bridge
// the two module systems using dynamic import().
const parse = async function (sourceContent, absoluteSourcePath) {
  const { default: parser } = await import('./index.js');
  return parser(sourceContent, absoluteSourcePath);
};

module.exports = parse;
module.exports.default = parse;
