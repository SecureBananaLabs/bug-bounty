import { createJob, updateJob } from '../../services/jobService';

describe('Job Service', () => {
  describe('createJob', () => {
    it('should reject jobs with inverted budget ranges', async () => {
      const invalidJob = {
        title: 'Test Job',
        description: 'Test Description',
        budgetMin: 100,
        budgetMax: 50,
      };

      await expect(createJob(invalidJob, 'user123')).rejects.toThrow();
    });

    it('should create jobs with valid budget ranges', async () => {
      const validJob = {
        title: 'Test Job',
        description: 'Test Description',
        budgetMin: 50,
        budgetMax: 100,
      };

      await expect(createJob(validJob, 'user123')).resolves.not.toThrow();
    });
  });

  describe('updateJob', () => {
    it('should reject job updates with inverted budget ranges', async () => {
      const invalidUpdate = {
        budgetMin: 100,
        budgetMax: 50,
      };

      await expect(updateJob('job123', invalidUpdate, 'user123')).rejects.toThrow();
    });

    it('should accept partial job updates without budget validation', async () => {
      const partialUpdate = {
        title: 'Updated Title',
      };

      await expect(updateJob('job123', partialUpdate, 'user123')).resolves.not.toThrow();
    });

    it('should accept valid budget range updates', async () => {
      const validUpdate = {
        budgetMin: 50,
        budgetMax: 100,
      };

      await expect(updateJob('job123', validUpdate, 'user123')).resolves.not.toThrow();
    });
  });
});