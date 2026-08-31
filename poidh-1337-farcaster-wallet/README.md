# POIDH Base bounty 1337 — Farcaster web wallet

Target bounty: **“Fork Farcaster Client and add a Wallet”**.

Upstream client: https://github.com/farcasterxyz/client

Patch target: `apps/farcaster-web/src/pages/wallet/WalletPage.tsx`

Upstream snapshot inspected: commit `b6922e24036cac6f5e6d51904a59ff7cfcdd8483`.

## What this adds

The open-source Farcaster client snapshot includes the Wallet route but the web page currently only says the Farcaster Wallet is available on mobile. This implementation replaces that placeholder with a functioning **injected EIP-1193 wallet UI**.

Features:

- Connect an injected EVM wallet (MetaMask, Rabby, Coinbase Wallet, etc.)
- Read the connected address
- Read native ETH balance
- Display the active chain ID
- Switch/add Base (`0x2105`)
- Copy the receive address
- Send native ETH through `eth_sendTransaction`
- Listen for account and chain changes
- No private key, seed phrase, or custody logic is stored by the Farcaster client

## Security model

The patch deliberately does **not** recreate the removed custodial Farcaster Wallet implementation. It delegates signing and key storage to the user's EIP-1193 provider. Every transaction is reviewed and approved inside the user's wallet.

## Apply to an actual fork

Copy the included `WalletPage.tsx` over the same path in a fork of `farcasterxyz/client`:

```text
apps/farcaster-web/src/pages/wallet/WalletPage.tsx
```

Then run the Farcaster web app using the upstream repository's normal development instructions.

## Acceptance demo

1. Open `/wallet` in the web client with an injected EVM wallet available.
2. Click **Connect wallet** and approve account access.
3. Confirm address, balance, and chain ID render.
4. Click **Switch to Base** if not already on Base.
5. Copy the receive address or enter a recipient + ETH amount.
6. Click **Review in wallet**; the injected wallet must present the transaction for explicit user approval.

No transaction is sent without the wallet provider's confirmation.

## Bounty proof

This directory is a self-contained patch/proof package. A literal GitHub fork still has to be created in GitHub before final submission if the bounty issuer requires the repository relationship itself rather than an upstream-targeted patch.