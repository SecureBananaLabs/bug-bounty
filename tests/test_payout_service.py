--- a/tests/test_payout_service.py
+++ b/tests/test_payout_service.py
@@ -210,6 +210,28 @@ class TestPayoutService:
         with pytest.raises(DuplicatePayoutError):
             svc.pay_bounty(2885)
 
+    def test_pay_bounty_resolved_status_allows_payout(self):
+        """Bounties marked RESOLVED must still be payable (issue #7458)."""
+        svc, repo = self._make_service()
+        repo.add_bounty(id=2885, status=BountyStatus.RESOLVED, reward_amount=500)
+        payout = svc.pay_bounty(2885)
+        assert payout.amount == 500
+        assert repo.get_bounty(2885).status == BountyStatus.PAID
+
+    def test_pay_bounty_retries_after_failed_payout(self):
+        """A FAILED payout must not permanently block the bounty."""
+        svc, repo = self._make_service()
+        repo.add_bounty(id=2885, status=BountyStatus.COMPLETED, reward_amount=500)
+        repo.add_payout(bounty_id=2885, status=PayoutStatus.FAILED)
+        payout = svc.pay_bounty(2885)
+        assert payout.status == PayoutStatus.SUCCEEDED
+
+    def test_pay_bounty_duplicate_succeeded_still_blocked(self):
+        svc, repo = self._make_service()
+        repo.add_bounty(id=2885, status=BountyStatus.COMPLETED, reward_amount=500)
+        repo.add_payout(bounty_id=2885, status=PayoutStatus.SUCCEEDED)
+        with pytest.raises(DuplicatePayoutError):
+            svc.pay_bounty(2885)