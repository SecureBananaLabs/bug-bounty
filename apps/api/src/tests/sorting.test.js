const { parseSorting } = require('../utils/sorting');

describe('parseSorting', () => {
  const allowedFields = ['name', 'createdAt', 'updatedAt', 'price', 'rating'];
  const defaultField = 'createdAt';
  const defaultOrder = 'desc';

  describe('valid inputs', () => {
    test('should parse field with asc direction', () => {
      const result = parseSorting('name:asc', allowedFields, defaultField, defaultOrder);
      expect(result).toEqual({ field: 'name', order: 'asc' });
    });

    test('should parse field with desc direction', () => {
      const result = parseSorting('price:desc', allowedFields, defaultField, defaultOrder);
      expect(result).toEqual({ field: 'price', order: 'desc' });
    });

    test('should parse field without direction (defaults to asc)', () => {
      const result = parseSorting('rating', allowedFields, defaultField, defaultOrder);
      expect(result).toEqual({ field: 'rating', order: 'asc' });
    });

    test('should handle uppercase direction', () => {
      const result = parseSorting('name:ASC', allowedFields, defaultField, defaultOrder);
      expect(result).toEqual({ field: 'name', order: 'asc' });
    });

    test('should handle mixed case direction', () => {
      const result = parseSorting('price:DeSc', allowedFields, defaultField, defaultOrder);
      expect(result).toEqual({ field: 'price', order: 'desc' });
    });

    test('should trim whitespace from field and direction', () => {
      const result = parseSorting('  name  :  desc  ', allowedFields, defaultField, defaultOrder);
      expect(result).toEqual({ field: 'name', order: 'desc' });
    });
  });

  describe('invalid field handling', () => {
    test('should use default field when field not in allowedFields', () => {
      const result = parseSorting('invalidField:asc', allowedFields, defaultField, defaultOrder);
      expect(result).toEqual({ field: defaultField, order: 'asc' });
    });

    test('should use default field when field is empty string', () => {
      const result = parseSorting(':asc', allowedFields, defaultField, defaultOrder);
      expect(result).toEqual({ field: defaultField, order: 'asc' });
    });

    test('should use default field for SQL injection attempt', () => {
      const result = parseSorting("name; DROP TABLE users;--:asc", allowedFields, defaultField, defaultOrder);
      expect(result).toEqual({ field: defaultField, order: 'asc' });
    });

    test('should use default field for path traversal attempt', () => {
      const result = parseSorting('../../etc/passwd:asc', allowedFields, defaultField, defaultOrder);
      expect(result).toEqual({ field: defaultField, order: 'asc' });
    });
  });

  describe('invalid direction handling', () => {
    test('should default to asc for invalid direction', () => {
      const result = parseSorting('name:invalid', allowedFields, defaultField, defaultOrder);
      expect(result).toEqual({ field: 'name', order: 'asc' });
    });

    test('should default to asc for empty direction', () => {
      const result = parseSorting('name:', allowedFields, defaultField, defaultOrder);
      expect(result).toEqual({ field: 'name', order: 'asc' });
    });

    test('should default to asc for random string direction', () => {
      const result = parseSorting('name:foo', allowedFields, defaultField, defaultOrder);
      expect(result).toEqual({ field: 'name', order: 'asc' });
    });
  });

  describe('missing or empty query', () => {
    test('should return defaults when query is undefined', () => {
      const result = parseSorting(undefined, allowedFields, defaultField, defaultOrder);
      expect(result).toEqual({ field: defaultField, order: defaultOrder });
    });

    test('should return defaults when query is null', () => {
      const result = parseSorting(null, allowedFields, defaultField, defaultOrder);
      expect(result).toEqual({ field: defaultField, order: defaultOrder });
    });

    test('should return defaults when query is empty string', () => {
      const result = parseSorting('', allowedFields, defaultField, defaultOrder);
      expect(result).toEqual({ field: defaultField, order: defaultOrder });
    });

    test('should return defaults when query is whitespace only', () => {
      const result = parseSorting('   ', allowedFields, defaultField, defaultOrder);
      expect(result).toEqual({ field: defaultField, order: defaultOrder });
    });
  });

  describe('default order normalization', () => {
    test('should normalize defaultOrder to asc when given ASC', () => {
      const result = parseSorting(undefined, allowedFields, defaultField, 'ASC');
      expect(result.order).toBe('asc');
    });

    test('should normalize defaultOrder to desc when given DESC', () => {
      const result = parseSorting(undefined, allowedFields, defaultField, 'DESC');
      expect(result.order).toBe('desc');
    });

    test('should default to asc for invalid defaultOrder', () => {
      const result = parseSorting(undefined, allowedFields, defaultField, 'invalid');
      expect(result.order).toBe('asc');
    });
  });

  describe('edge cases', () => {
    test('should handle field with colon in name (only first colon splits)', () => {
      // This tests that we only split on first colon
      const fieldsWithColon = ['name:full', 'createdAt'];
      const result = parseSorting('name:full:asc', fieldsWithColon, defaultField, defaultOrder);
      // The field would be 'name' which is not in allowedFields, so defaults
      expect(result.field).toBe(defaultField);
    });

    test('should work with single allowed field', () => {
      const result = parseSorting('name:desc', ['name'], 'name', 'asc');
      expect(result).toEqual({ field: 'name', order: 'desc' });
    });

    test('should return default when allowedFields is empty', () => {
      const result = parseSorting('name:asc', [], 'createdAt', 'desc');
      expect(result).toEqual({ field: 'createdAt', order: 'asc' });
    });
  });
});