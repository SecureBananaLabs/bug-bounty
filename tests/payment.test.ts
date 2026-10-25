--- a/tests/payment.test.ts
+++ b/tests/payment.test.ts
@@ -78,4 +78,18 @@
+  describe('Bounty #2885 - Payment issue', () => {
+    it('should pay full reward amount without deduction', async () => {
+      const bounty = await createTestBounty({ rewardAmount: 5000, status: 'approved' });
+      const payment = await bountyPaymentService.processPayout(bounty.id);
+      expect(payment.amount).toBe(5000);
+      expect(payment.amount).not.toBe(4500);
+    });
+    it('should process payment for approved bounties', async () => {
+      const bounty = await createTestBounty({ rewardAmount: 1000, status: 'approved' });
+      const payment = await bountyPaymentService.processPayout(bounty.id);
+      expect(payment.status).toBe('completed');
+    });
+  });
