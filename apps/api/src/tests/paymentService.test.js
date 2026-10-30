const paymentService = require('../services/paymentService');

describe('paymentService', () => {
  describe('generatePaymentId', () => {
    it('keeps the historical pay_ prefix', () => {
      const paymentId = paymentService.generatePaymentId();

      expect(paymentId.startsWith('pay_')).toBe(true);
    });

    it('generates unique IDs even when Date.now() returns the same millisecond', () => {
      const fixedNow = 1750000000000;
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(fixedNow);

      try {
        const total = 1000;
        const ids = new Set();

        for (let i = 0; i < total; i += 1) {
          ids.add(paymentService.generatePaymentId());
        }

        expect(ids.size).toBe(total);
      } finally {
        nowSpy.mockRestore();
      }
    });
  });

  describe('createPaymentIntent', () => {
    it('assigns unique paymentIds to intents created in the same millisecond', async () => {
      const fixedNow = 1750000000000;
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(fixedNow);

      try {
        const total = 250;
        const intents = await Promise.all(
          Array.from({ length: total }, (_, index) =>
            paymentService.createPaymentIntent({
              amount: 1000 + index,
              currency: 'usd',
            })
          )
        );

        const ids = new Set(intents.map((intent) => intent.paymentId));

        expect(ids.size).toBe(total);
        intents.forEach((intent) => {
          expect(intent.paymentId.startsWith('pay_')).toBe(true);
        });
      } finally {
        nowSpy.mockRestore();
      }
    });
  });
});
