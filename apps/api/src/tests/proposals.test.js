import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createProposalSchema } from '../validators/proposal.js';

describe('Proposal Validation Schema', () => {
  it('accepts valid proposal payload with estimatedDuration within bounds', () => {
    const valid = {
      jobId: 'job_123',
      coverLetter: 'I have 5 years experience in building high performance apps.',
      bidAmount: 750,
      estimatedDuration: '2 weeks'
    };

    const parsed = createProposalSchema.parse(valid);
    assert.equal(parsed.estimatedDuration, '2 weeks');
    assert.equal(parsed.bidAmount, 750);
  });

  it('rejects empty estimatedDuration string', () => {
    const invalid = {
      jobId: 'job_123',
      coverLetter: 'I have 5 years experience in building high performance apps.',
      bidAmount: 750,
      estimatedDuration: ''
    };

    assert.throws(() => createProposalSchema.parse(invalid));
  });

  it('rejects estimatedDuration exceeding 100 characters', () => {
    const invalid = {
      jobId: 'job_123',
      coverLetter: 'I have 5 years experience in building high performance apps.',
      bidAmount: 750,
      estimatedDuration: 'a'.repeat(101)
    };

    assert.throws(() => createProposalSchema.parse(invalid));
  });
});
