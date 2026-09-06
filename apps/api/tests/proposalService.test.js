const ProposalService = require('../src/services/proposalService');
const db = require('../src/config/db');

jest.mock('../src/config/db', () => ({
  collection: jest.fn().mockReturnThis(),
  insertOne: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  deleteOne: jest.fn(),
  find: jest.fn().mockReturnThis(),
  toArray: jest.fn(),
}));

describe('ProposalService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProposal', () => {
    it('should generate a server-owned id and ignore client-supplied id', async () => {
      const maliciousPayload = {
        id: 'attacker-controlled-id',
        title: 'Test Proposal',
        amount: 100,
      };

      db.insertOne.mockResolvedValue({ insertedId: 'some-mongo-id' });

      const result = await ProposalService.createProposal(maliciousPayload);

      // Verify the inserted document has a server-generated id starting with 'prp_'
      const insertedDoc = db.insertOne.mock.calls[0][0];
      expect(insertedDoc.id).toMatch(/^prp_\d+$/);
      expect(insertedDoc.id).not.toBe('attacker-controlled-id');

      // Verify the returned proposal has the server-generated id
      expect(result.id).toMatch(/^prp_\d+$/);
      expect(result.title).toBe('Test Proposal');
      expect(result.amount).toBe(100);
    });

    it('should preserve all legitimate proposal fields', async () => {
      const payload = {
        title: 'Legit Proposal',
        description: 'A valid proposal',
        amount: 500,
        userId: 'user123',
      };

      db.insertOne.mockResolvedValue({ insertedId: 'some-mongo-id' });

      const result = await ProposalService.createProposal(payload);

      const insertedDoc = db.insertOne.mock.calls[0][0];
      expect(insertedDoc.title).toBe('Legit Proposal');
      expect(insertedDoc.description).toBe('A valid proposal');
      expect(insertedDoc.amount).toBe(500);
      expect(insertedDoc.userId).toBe('user123');
      expect(insertedDoc.id).toMatch(/^prp_\d+$/);
    });

    it('should handle empty payload gracefully', async () => {
      db.insertOne.mockResolvedValue({ insertedId: 'some-mongo-id' });

      const result = await ProposalService.createProposal({});

      const insertedDoc = db.insertOne.mock.calls[0][0];
      expect(insertedDoc.id).toMatch(/^prp_\d+$/);
      expect(Object.keys(insertedDoc)).toEqual(['id']);
    });
  });
});