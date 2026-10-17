# Notes From the Request Cycle

A request arrives without a name,
so the middleware lends it one —
a short id, stamped in the header,
and the log can follow it home.

Nothing is trusted at the border.
The body is parsed, then questioned:
is the budget a number, is the role allowed,
did the caller forget the file entirely?
A good answer is a small answer:
twenty with the page it asked for,
not the whole shelf of stored jobs
dumped across the counter at once.

When two writers arrive in the same millisecond,
the ids must still disagree,
so each record keeps its own surname
and no history is overwritten.
Anything the server already knows —
the id, the timestamp, the open status —
is set after the payload is read,
never borrowed from a stranger.

And when the process is told to stop,
it stops: it closes the listener,
drains what is in flight,
and leaves the port free for the next one.

---

Creative decision: I chose a plain four-beat, rhyming-free form in four short
stanzas because the work itself is unglamorous plumbing — request ids, validation,
stable ids, graceful shutdown — and a quiet, procedural voice matches a service
whose whole job is to answer consistently and then get out of the way.
