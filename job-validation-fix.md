# Bug Fix: Job validation should reject inverted budget ranges

## Summary
This PR adds validation to `createJobSchema` to ensure `budgetMax` is always greater than or equal to `budgetMin`. The fix also applies to partial job updates when both budget fields are present in the payload.

Closes #2853
/attempt
/claim #2853

Bounty Reward Wallet: 0x96eE7904BdCd8a2c71B4FFc3362C96b1Aae03e0 (Base / EVM)
