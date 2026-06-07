import { connectDatabase, disconnectDatabase, UserModel, JobModel, ProposalModel, MessageModel, ReviewModel, PaymentModel, NotificationModel } from '@freelanceflow/db';

describe('@freelanceflow/db package entrypoint', () => {
  it('should export connectDatabase and disconnectDatabase functions', () => {
    expect(connectDatabase).toBeDefined();
    expect(typeof connectDatabase).toBe('function');
    expect(disconnectDatabase).toBeDefined();
    expect(typeof disconnectDatabase).toBe('function');
  });

  it('should export all model constructors', () => {
    expect(UserModel).toBeDefined();
    expect(JobModel).toBeDefined();
    expect(ProposalModel).toBeDefined();
    expect(MessageModel).toBeDefined();
    expect(ReviewModel).toBeDefined();
    expect(PaymentModel).toBeDefined();
    expect(NotificationModel).toBeDefined();
  });

  it('should have correct model names', () => {
    expect(UserModel.modelName).toBe('User');
    expect(JobModel.modelName).toBe('Job');
    expect(ProposalModel.modelName).toBe('Proposal');
    expect(MessageModel.modelName).toBe('Message');
    expect(ReviewModel.modelName).toBe('Review');
    expect(PaymentModel.modelName).toBe('Payment');
    expect(NotificationModel.modelName).toBe('Notification');
  });
});
