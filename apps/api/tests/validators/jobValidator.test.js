const { createJobSchema, updateJobSchema, MAX_SKILLS } = require('../../src/validators/jobValidator');

describe('Job Validator', () => {
  describe('createJobSchema', () => {
    it('should validate a valid job with skills array', () => {
      const input = {
        title: 'Test Job',
        description: 'A test job description',
        budget: 100,
        skills: ['JavaScript', 'Node.js'],
        category: 'Development',
      };
      const { error, value } = createJobSchema.validate(input);
      expect(error).toBeUndefined();
      expect(value.skills).toEqual(['JavaScript', 'Node.js']);
    });

    it('should default skills to empty array when omitted', () => {
      const input = {
        title: 'Test Job',
        description: 'A test job description',
        budget: 100,
        category: 'Development',
      };
      const { error, value } = createJobSchema.validate(input);
      expect(error).toBeUndefined();
      expect(value.skills).toEqual([]);
    });

    it('should reject skills array exceeding MAX_SKILLS', () => {
      const input = {
        title: 'Test Job',
        description: 'A test job description',
        budget: 100,
        skills: Array(MAX_SKILLS + 1).fill('Skill'),
        category: 'Development',
      };
      const { error } = createJobSchema.validate(input);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('must contain less than or equal to');
    });

    it('should accept skills array with exactly MAX_SKILLS items', () => {
      const input = {
        title: 'Test Job',
        description: 'A test job description',
        budget: 100,
        skills: Array(MAX_SKILLS).fill('Skill'),
        category: 'Development',
      };
      const { error } = createJobSchema.validate(input);
      expect(error).toBeUndefined();
    });

    it('should reject empty skill strings', () => {
      const input = {
        title: 'Test Job',
        description: 'A test job description',
        budget: 100,
        skills: ['Valid', ''],
        category: 'Development',
      };
      const { error } = createJobSchema.validate(input);
      expect(error).toBeDefined();
    });

    it('should reject non-string skills', () => {
      const input = {
        title: 'Test Job',
        description: 'A test job description',
        budget: 100,
        skills: ['Valid', 123],
        category: 'Development',
      };
      const { error } = createJobSchema.validate(input);
      expect(error).toBeDefined();
    });
  });

  describe('updateJobSchema', () => {
    it('should validate a partial update with skills', () => {
      const input = { skills: ['React'] };
      const { error, value } = updateJobSchema.validate(input);
      expect(error).toBeUndefined();
      expect(value.skills).toEqual(['React']);
    });

    it('should reject skills array exceeding MAX_SKILLS on update', () => {
      const input = { skills: Array(MAX_SKILLS + 1).fill('Skill') };
      const { error } = updateJobSchema.validate(input);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('must contain less than or equal to');
    });

    it('should reject empty update object', () => {
      const { error } = updateJobSchema.validate({});
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('must contain at least 1');
    });
  });
});
