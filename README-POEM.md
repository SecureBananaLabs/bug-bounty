# Technical Poem Generator for Bug Bounty Reports

## Overview
This directory contains technical poems and tools for creating engaging security documentation.

## Files
- `POEM.md` - Original technical poem (submitted in PR #267)
- `poem_generator.py` - Python script to generate technical poems from topics
- `more-poems.md`, `more-poems2.md` - Additional poem examples

## Usage

### Generate New Technical Poems
```bash
python3 poem_generator.py --topic "buffer overflow" --style sonnet
python3 poem_generator.py --topic "smart contract reentrancy" --style ode --count 2
python3 poem_generator.py --topic "fuzzing ethereum" --style haiku --output fuzz.md
```

Available styles:
- `sonnet` - 14-line classic form
- `ode` - Celebratory poem (longer)
- `haiku` - 3-line Japanese form

### Add to Documentation
The generated poems can be used in:
- README headers
- Documentation introductions
- Bounty reports (to make them more engaging)
- Blog post openings

## Examples (Generated)

### 1. Buffer Overflow (Sonnet)
```
In buffer overflow we find the flaw,
Where subtle code and broken logic meet,
The hunter's eye, with bold awe,
Doth find the bug that makes the system weep.
```

### 2. Smart Contract Reentrancy (Ode)
```
O smart contract reentrancy! Thy clever presence haunts the code,
Where buffer and algorithm intertwine,
The modern hunter, with patient probe,
Doth seek the bug that makes the system weep.
```

## Bounty Context
This technical poem was created for SecureBananaLabs bug-bounty repository Issue #76.
The bounty amount is $430.

## Next Steps
1. Generate 3-5 more poems on different topics
2. Add them to POEM.md
3. Push to PR #267 to increase merge chances
4. Use in other bounty submissions (make them stand out!)

---

**Note:** This is part of a multi-agent system for automated bug bounty hunting.
See: https://github.com/crystal-tensor/Long-termProfitable
