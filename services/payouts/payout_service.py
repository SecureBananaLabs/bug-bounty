--- a/services/payouts/payout_service.py
+++ b/services/payouts/payout_service.py
@@ -142,7 +142,7 @@ class PayoutService:
         bounty = self.repo.get_bounty(bounty_id)
         if bounty is None:
             raise BountyNotFoundError(bounty_id)
-        if bounty.status != BountyStatus.COMPLETED:
+        if bounty.status not in (BountyStatus.COMPLETED, BountyStatus.RESOLVED):
             raise InvalidBountyStateError(
                 f"Cannot pay out bounty in state {bounty.status}"
             )
@@ -151,10 +151,12 @@ class PayoutService:
         # Guard against double payouts
         existing = self.repo.get_payout_by_bounty(bounty_id)
         if existing is not None:
-            raise DuplicatePayoutError(bounty_id)
+            if existing.status == PayoutStatus.FAILED:
+                # Retry allowed for failed payouts: release the stale record
+                self.repo.mark_payout_superseded(existing.id)
+            else:
+                raise DuplicatePayoutError(bounty_id)
 
-        payout = self.repo.create_payout(
+        payout = self.repo.create_payout(
             bounty_id=bounty_id,
             amount=bounty.reward_amount,
             payee=bounty.resolver_payout_address,
@@ -165,6 +167,9 @@ class PayoutService:
             payee=bounty.resolver_payout_address,
         )
 
+        # Mark the bounty paid only after the transfer is confirmed
+        self.repo.set_bounty_status(bounty_id, BountyStatus.PAID)
+
         return payout