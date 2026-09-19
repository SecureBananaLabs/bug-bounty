import { describe, it, expect, beforeEach } from 'vitest';
import * as proposalService from '../services/proposalService.js';

describe('proposalService', () => {
  beforeEach(() => {
    proposalService._reset();
  });

  it('should create a proposal with server-generated id', async () => {
    const p = await proposalService.createProposal({ bidAmount: 500 });
    expect(p.id).toMatch(/^prp_\d+_\d+$/);
    expect(p.bidAmount).toBe(500);
  });

  it('should not allow payload to override id', async () => {
    const p = await proposalService.createProposal({ id: 'hacked_prp' });
    expect(p.id).not.toBe('hacked_prp');
  });

  it('should generate unique IDs for same-millisecond creations', async () => {
    const items = await Promise.all([
      proposalService.createProposal({}),
      proposalService.createProposal({}),
      proposalService.createProposal({}),
    ]);
    const ids = items.map(x => x.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('should list all proposals', async () => {
    await proposalService.createProposal({ bidAmount: 100 });
    await proposalService.createProposal({ bidAmount: 200 });
    const list = await proposalService.listProposals();
    expect(list.length).toBe(2);
  });
});
