# Pixel Art for Bug Bounty Reports

## Overview
This directory contains pixel art images and tools for creating visual bug reports.

## Files
- `bug-found.png` - Example pixel art showing "bug found" (submitted in PR #268)
- `pixel_art_generator.py` - Python script to generate pixel art from text prompts

## Usage

### Generate New Pixel Art
```bash
python3 pixel_art_generator.py --prompt "critical vulnerability" --output critical.ppm
python3 pixel_art_generator.py --prompt "bug found in login" --output login-bug.ppm
python3 pixel_art_generator.py --prompt "SQL injection detected" --output sqli.ppm
```

### View Output
The script generates PPM files (viewable in most image viewers). Convert to PNG using:
```bash
python3 -c "
from PIL import Image
img = Image.open('input.ppm')
img.save('output.png')
"
```

## Examples (to be added)
- [ ] Login page bug
- [ ] Payment flow vulnerability  
- [ ] API endpoint exposure
- [ ] Access control bypass

## Bounty Context
This pixel art was created for SecureBananaLabs bug-bounty repository Issue #80.
The bounty amount is $780 (highest value in the repo).

## Next Steps
1. Generate 3-5 more pixel art examples
2. Add them to this directory
3. Update this README with screenshots
4. Push to PR #268 to increase merge chances

---

**Note:** This is part of a multi-agent system for automated bug bounty hunting.
See: https://github.com/crystal-tensor/Long-termProfitable
