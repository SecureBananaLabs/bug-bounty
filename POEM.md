# The Ledger's Watch

The request arrives — a payload, a promise,
an amount in cents, a currency code,
and behind the curtain, the service awakens:
key in hand, it knocks at Stripe's door.

Not long ago, we faked the receipt,
stamped `pay_` with the millisecond's count,
pretended the transaction had substance,
and returned a hollow confirmation.

But now the gateway demands credentials.
`STRIPE_SECRET_KEY` must be set,
or the whole house folds — no phantom charges,
no empty authorizations drift through.

The amount must be whole, must be positive,
an integer of cents, not dollars and dreams.
One thousand for ten, five hundred for five —
the smallest unit the ledger respects.

And currency? Three letters, no more,
`usd` by default, eagle's tender,
but `eur` or `gbp` pass through just as well
if they wear their proper acronym coat.

Then the call goes out across the wire:
*create intent*, the method says,
and Stripe's machinery grinds into motion,
spinning a `client_secret` from the transaction.

If the card is declined, the error is clear —
*card error*, it says, with the issuer's reason.
If the request is malformed, *invalid request*,
every stripe of failure named for what it is.

We catch them all, these colored exceptions,
and wrap them in our own `PaymentError` coat,
passing message and status up the chain
so the caller knows exactly what went wrong.

No more `pay_` and `Date.now()` —
the stub is buried, the real path laid.
The gateway stands, the secret held secure,
and every charge is now a genuine charge.