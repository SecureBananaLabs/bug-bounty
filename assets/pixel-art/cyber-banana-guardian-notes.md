# Cyber Banana Guardian Pixel Art

/claim #80

## Creative Note

This asset is an original 64x64 pixel-art PNG showing a cyber banana guardian protecting a glowing code vault. I chose the subject because it matches the repository's playful security and bug-bounty theme while keeping the image compact enough to inspect at true pixel scale.

## Files

- `assets/pixel-art/cyber-banana-guardian.png` - original 64x64 PNG pixel-art asset
- `assets/pixel-art/generate_cyber_banana_guardian.py` - stdlib-only generator that recreates the PNG
- `assets/pixel-art/cyber-banana-guardian-demo.svg` - animated preview card for quick review

## Acceptance Checklist

- Original pixel art: the PNG was created specifically for this repository.
- Submitted under `/assets/pixel-art/`: the PNG, generator, notes, and review preview live in this directory.
- Minimum canvas size: the PNG is exactly 64x64 pixels.
- PR description note: this file preserves the one-line creative note and `/claim #80` in the branch diff for reviewer visibility.

## Validation

```bash
python3 assets/pixel-art/generate_cyber_banana_guardian.py /tmp/cyber-banana-guardian.png
python3 -m py_compile assets/pixel-art/generate_cyber_banana_guardian.py
file assets/pixel-art/cyber-banana-guardian.png
```
