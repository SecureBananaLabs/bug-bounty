<content>
import { createPayment } from '../../src/controllers/paymentController.js';
import { createPaymentIntent } from '../../src/services/paymentService.js';
import { ZodError } from 'zod';

jest.mock('../../src/services/paymentService.js');

describe('createPayment', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: { amount: 100 } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('should return 201 for valid positive amount', async () => {
    await createPayment(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should reject zero amount with 400', async () => {
    req.body.amount = 0;
    await createPayment(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('should reject negative amount with 400', async () => {
    req.body.amount = -10;
    await createPayment(req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('should reject NaN with 400', async () => {
    req.body.amount = NaN;
    await createPayment(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('should reject non-finite number with 400', async () => {
    req.body.amount = Infinity;
    await createPayment(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});
</content>