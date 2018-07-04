const { assert } = require('chai');
const { parseBoolean, QueryParserError } = require('../../src/services/query-parsers');

describe('query-parsers', function () {
  describe('parseBoolean', () => {
    it('should properly parse booleans', () => {
      assert.equal(parseBoolean('0'), false);
      assert.equal(parseBoolean('1'), true);
      assert.equal(parseBoolean('true'), true);
      assert.equal(parseBoolean('false'), false);
    });

    it('should throw a QueryParserError when ambiguous', () => {
      assert.throws(() => parseBoolean('maybe'), QueryParserError);
    });
  });
});
