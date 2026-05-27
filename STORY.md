# The Last Bug

Elara stared at the terminal. Forty-seven hours without sleep. The cursor blinked at her, mocking.

"It's right there," she whispered. "Somewhere."

The bug had evaded her for three days. A race condition that only manifested in production, under a full moon, when the server load hit exactly 73%. She'd tried everything. Logging. Breakpoints. Even printed out the entire codebase and pinned it to her wall.

Then she saw it.

Line 892. A single misplaced closing bracket. The kind of mistake first-year students make. She'd written it during a 2 AM deployment, too tired to notice, too confident to double-check.

She deleted the bracket. Recompiled. The tests turned green.

Elara smiled. Somewhere out there, 10,000 users would never know how close they came to disaster. But she knew. And that was enough.