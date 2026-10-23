# PI Artifact for Issue #2883

This artifact continues the reproducible PI-prefix work for
SecureBananaLabs/bug-bounty#2883.

## Contents

- `pi-314159-2883.txt`: compact `3.<digits>` value with 314,159 decimal
  places after the decimal point.
- `../../scripts/pi_chudnovsky.py`: standard-library Chudnovsky generator and
  verifier.

## Verification

```bash
python3 scripts/pi_chudnovsky.py --digits 314159 --check docs/pi/pi-314159-2883.txt
```

Expected output:

```text
digits=314159
sha256=ded9098a1a2ebfd929ab16809d801f83056c55175287d483774a309d1be267a1
```

The verifier also checks that the generated value begins with the 100 decimal
places provided in the issue seed.
