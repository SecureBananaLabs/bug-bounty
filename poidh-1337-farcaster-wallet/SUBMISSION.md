# POIDH claim draft — Base bounty 1337

## Claim title

Farcaster web wallet — injected EIP-1193 implementation

## Claim description

Implemented a functional non-custodial wallet flow for the open-source Farcaster web client, replacing the existing `/wallet` placeholder.

The implementation targets:

`apps/farcaster-web/src/pages/wallet/WalletPage.tsx`

It adds:

- injected EIP-1193 wallet connection
- connected address display
- native ETH balance lookup
- active chain display
- Base network switch/add flow (`0x2105`)
- receive-address copy action
- native ETH send requests via `eth_sendTransaction`
- account/chain-change listeners
- explicit wallet-provider approval for every transaction
- no seed phrase/private-key storage in the Farcaster client

Live interactive proof:

https://plasma-rift-8hg9a9f.shipstatic.com

Source/proof branch:

https://github.com/coleyp118/bug-bounty/tree/poidh-1337-farcaster-wallet/poidh-1337-farcaster-wallet

Upstream target:

https://github.com/farcasterxyz/client

## Final pre-submit checks

- If the issuer requires a literal GitHub fork relationship, create `coleyp118/client` using GitHub's Fork button and copy the implementation into the matching upstream path before submitting this claim.
- Verify the bounty is still open and funded on POIDH immediately before signing the claim transaction.
- Submit only from the wallet that should receive the bounty payout.
