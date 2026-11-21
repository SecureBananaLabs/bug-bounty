# Request Lifecycle

*A poem in the shape of this codebase — one stanza per layer a request passes
through, in the order `apps/api` passes it.*

---

### I. Middleware

Before the door will open there are hands.
One straightens the helmet. One asks where you're from
and shrugs, and waves you by. The third one counts:
how many times you've knocked, how fast, how hungry.
Nothing here learns your name.
It only learns your rhythm.

### II. /health

Someone asks the quiet question first —
*are you there* — and the answer comes back whole,
two fields wide, no caveat, no body:
`ok: true`, `service: "api"`.
The smallest promise in the building,
and the only one it always keeps.

### III. Routes

Eleven hallways branch off one plain floor:
auth, users, jobs, proposals, payments, reviews,
messages, notifications, uploads, search, admin —
a litany that reads like a working life.
Each door is one line long.
Each door goes somewhere real.

### IV. Validators

The schema is a kind of mercy.
It says: *your title needs four letters,*
*your description ten,*
*your budget cannot be less than nothing,*
*your password must be eight — we are not asking why.*
Better to be turned back at the threshold
than let in, and then lost.

### V. Services

`const proposals = []`

Here is the honest part. Every bid
a freelancer wrote at two in the morning —
the careful paragraph, the number
they argued with themselves about —
lands in an array, in memory, in a process
that will end. We stamp each one `prp_` and the millisecond,
as though a millisecond were a place to live.

### VI. The Error Handler

And when it breaks — it breaks —
the stack trace goes to the log and nowhere else.
To you we say the gentle, useless thing:
*Unexpected server error.*
Unexpected. As if we hadn't built the catch
with our own hands, knowing. As if five hundred
were not a number we wrote down in advance.

### VII. Response

Two shapes leave this house: `success: true`
holding something, or `success: false`
holding a sentence. The difference is everything
and it is one boolean deep.
Somewhere a client refreshes the dashboard.
Somewhere a freelancer waits to learn which one arrived.
