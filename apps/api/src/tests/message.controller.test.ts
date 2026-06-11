import { createMessage } from '../controllers/message.controller';
import { Request, Response } from 'express';
import { createMessageSchema } from '../controllers/message.controller';

describe('Message Controller', () => {
  it('should create a message with valid data', async () => {
    const req = {
      body: {
        content: 'Hello, world!',
        recipientId: '12345',
      },
    } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    await createMessage(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should throw an error with invalid data', async () => {
    const req = {
      body: {
        content: '',
        recipientId: '',
      },
    } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const next = jest.fn();
    await createMessage(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should validate message content', async () => {
    const validContent = 'Hello, world!';
    const invalidContent = '';
    const tooLongContent = 'a'.repeat(5001);

    expect(() => createMessageSchema.parse({ content: validContent, recipientId: '12345' })).not.toThrow();
    expect(() => createMessageSchema.parse({ content: invalidContent, recipientId: '12345' })).toThrow();
    expect(() => createMessageSchema.parse({ content: tooLongContent, recipientId: '12345' })).toThrow();
  });

  it('should validate recipient ID', async () => {
    const validRecipientId = '12345';
    const invalidRecipientId = '';

    expect(() => createMessageSchema.parse({ content: 'Hello, world!', recipientId: validRecipientId })).not.toThrow();
    expect(() => createMessageSchema.parse({ content: 'Hello, world!', recipientId: invalidRecipientId })).toThrow();
  });
});