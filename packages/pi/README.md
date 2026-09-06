# @freelanceflow/pi

Arbitrary-precision pi generator with independent verification.

Pi is irrational, so it has no last decimal place and no exact decimal form. What
this package provides instead is any finite number of correct digits on demand,
together with the means to show that they are correct.

Zero runtime dependencies. Plain ESM. All arithmetic uses Node's native `BigInt`,
so the numeric core is exact at every step and no floating-point rounding enters
the result.

## Install

The package is part of the monorepo workspace. No installation step beyond the
repository root `npm install`.

## API

```js
import { computePi, hexDigitAt, verifyPi } from "@freelanceflow/pi";
```

### `computePi(digits)`

Returns pi to `digits` decimal places as a string, including the leading `3.`
and the point. `computePi(5)` returns `"3.14159"`. `computePi(0)` returns `"3"`.
Digits are truncated, not rounded. Throws on negative, non-integer or
non-numeric input.

### `hexDigitAt(position)`

Returns a single hexadecimal digit of the fractional part of pi as a string,
counting from 1. Uses the BBP formula, so the digit is computed without
computing any digit before it. Position 1,000,000 costs no more than a
handful of positions near the start.

### `verifyPi(digits)`

Runs the verification suite against a freshly computed value and returns a
report giving each check, its result and its supporting figures.

## CLI

```bash
npx pi 1000
npx pi 1000 --format grouped
npx pi 1000 --verify
```

`--format` takes `plain`, the default, `grouped` for ten-digit groups labelled by
decimal place, or `json`. `--verify` runs the verification suite, prints one line
per check and exits with a non-zero status if any check fails. So does a bad
argument.

## Verification

Anyone can print digits. The harder claim is that the digits are right, so the
package treats verification as part of the product rather than as testing
scaffolding.

The generator uses the Chudnovsky series evaluated by binary splitting. It is
checked against three oracles, none of which shares any code with the generator
or with each other. Shared code would weaken the agreement between them, so the
independence is deliberate.

- **Machin's formula.** An arctangent series in scaled fixed point. Slow and
  quadratic, which is acceptable because its job is to disagree with Chudnovsky
  if Chudnovsky is wrong, not to compete on speed.
- **BBP.** Spot-audits individual hexadecimal digits at arbitrary positions
  without computing the digits before them. This is the check that scales to
  deep positions.
- **Digit distribution.** Chi-squared statistic against a uniform expectation.
  Pi is conjectured to be normal, so a large sample should sit near uniform.
  This is a smoke test rather than a proof: it cannot confirm a correct result,
  but a fabricated or repeating sequence fails it immediately.

## Complexity

Binary splitting keeps the term recursion balanced and the operand sizes
growing evenly, which avoids the quadratic behaviour of a naive term-by-term
summation. The integer square root works at progressive precision, so its cost
is dominated by its final iteration rather than by a fixed number of full-width
ones.

Measured on Node 26 on one core:

| Digits | `computePi` | `verifyPi` |
| --- | --- | --- |
| 1,000 | 0.1 ms | 4 ms |
| 10,000 | 2 ms | 41 ms |
| 100,000 | 65 ms | 0.6 s |
| 1,000,000 | 1.2 s | not measured |

Growth over that range is roughly n^1.4, so subquadratic in practice, which is
what V8's Karatsuba and Toom-Cook thresholds for large operands give. No
asymptotic bound is claimed beyond what those figures show.

## Tests

```bash
npm test -w packages/pi
```
