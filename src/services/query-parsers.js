class QueryParserError extends Error {};

const BOOL_MAPPING = new Map([
  ['0', false],
  ['1', true],
  ['false', false],
  ['true', true],
]);

function parseBoolean (token) {
  const normalizedToken = (token || '').toLowerCase();
  if (!BOOL_MAPPING.has(normalizedToken)) {
    const acceptableValues = Array.from(BOOL_MAPPING.keys()).join(', ');
    let msg = `Invalid boolean value - must be one of ${acceptableValues}`;
    throw new QueryParserError(msg);
  }
  return BOOL_MAPPING.get(normalizedToken);
};

module.exports = {
  QueryParserError: QueryParserError,
  parseBoolean: parseBoolean
};
