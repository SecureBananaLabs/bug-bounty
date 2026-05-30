const threads = [
  {
    id: "thread-1",
    name: "Maya Chen",
    project: "Marketplace onboarding flow",
    lastMessage: "I sent the final screens and can start the handoff today.",
    time: "9:42 AM",
    unread: 2,
    status: "Awaiting review"
  },
  {
    id: "thread-2",
    name: "Northstar Studio",
    project: "Brand refresh",
    lastMessage: "The updated invoice is attached to the milestone.",
    time: "Yesterday",
    unread: 0,
    status: "Milestone open"
  },
  {
    id: "thread-3",
    name: "Owen Patel",
    project: "API audit",
    lastMessage: "Can you confirm the staging URL before I run the checks?",
    time: "Mon",
    unread: 1,
    status: "Needs reply"
  }
];

const messages = [
  {
    id: "msg-1",
    author: "Maya Chen",
    text: "I uploaded the final onboarding screens and annotated the edge states.",
    time: "9:12 AM",
    mine: false
  },
  {
    id: "msg-2",
    author: "You",
    text: "Great. I will review the mobile breakpoints and approve the milestone if everything matches the brief.",
    time: "9:28 AM",
    mine: true
  },
  {
    id: "msg-3",
    author: "Maya Chen",
    text: "Sounds good. I can start the handoff package right after your review.",
    time: "9:42 AM",
    mine: false
  }
];

const quickReplies = ["Looks good", "Send files", "Schedule call"];

export default function MessagingPage() {
  const activeThread = threads[0];

  return (
    <section>
      <div style={{ marginBottom: "1rem" }}>
        <h2 style={{ marginBottom: "0.35rem" }}>Messaging</h2>
        <p style={{ color: "#b8c3e6", margin: 0 }}>
          Track project conversations, unread replies, and milestone context from one inbox.
        </p>
      </div>

      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <aside className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Inbox</h3>
            <span style={{ color: "#8fd6ff", fontWeight: 700 }}>3 active</span>
          </div>

          <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
            {threads.map((thread) => (
              <article
                key={thread.id}
                style={{
                  border: thread.id === activeThread.id ? "1px solid #8fd6ff" : "1px solid #2a3765",
                  borderRadius: 8,
                  padding: "0.85rem",
                  background: thread.id === activeThread.id ? "#1b294a" : "#111830"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem" }}>
                  <strong>{thread.name}</strong>
                  <span style={{ color: "#aab6db", whiteSpace: "nowrap" }}>{thread.time}</span>
                </div>
                <p style={{ color: "#8fd6ff", margin: "0.35rem 0" }}>{thread.project}</p>
                <p style={{ color: "#d8def3", margin: 0 }}>{thread.lastMessage}</p>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.65rem" }}>
                  <span style={{ color: "#aab6db" }}>{thread.status}</span>
                  {thread.unread > 0 ? (
                    <span
                      aria-label={`${thread.unread} unread messages`}
                      style={{
                        background: "#22c55e",
                        color: "#07120b",
                        borderRadius: 999,
                        minWidth: 24,
                        textAlign: "center",
                        fontWeight: 700,
                        padding: "0.05rem 0.45rem"
                      }}
                    >
                      {thread.unread}
                    </span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </aside>

        <article className="card" style={{ marginBottom: 0 }}>
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
              borderBottom: "1px solid #2a3765",
              paddingBottom: "1rem"
            }}
          >
            <div>
              <h3 style={{ margin: 0 }}>{activeThread.project}</h3>
              <p style={{ color: "#b8c3e6", margin: "0.35rem 0 0" }}>{activeThread.name}</p>
            </div>
            <button
              type="button"
              style={{
                alignSelf: "start",
                background: "#8fd6ff",
                border: 0,
                borderRadius: 8,
                color: "#081224",
                cursor: "pointer",
                fontWeight: 700,
                padding: "0.55rem 0.85rem"
              }}
            >
              View milestone
            </button>
          </header>

          <div style={{ display: "grid", gap: "0.85rem", margin: "1rem 0" }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  justifySelf: message.mine ? "end" : "start",
                  maxWidth: "78%",
                  border: "1px solid #2a3765",
                  borderRadius: 8,
                  padding: "0.85rem",
                  background: message.mine ? "#20365f" : "#111830"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <strong>{message.author}</strong>
                  <span style={{ color: "#aab6db" }}>{message.time}</span>
                </div>
                <p style={{ margin: "0.45rem 0 0", color: "#edf2ff" }}>{message.text}</p>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid #2a3765", paddingTop: "1rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  style={{
                    background: "#111830",
                    border: "1px solid #2a3765",
                    borderRadius: 8,
                    color: "#f2f5ff",
                    cursor: "pointer",
                    padding: "0.45rem 0.7rem"
                  }}
                >
                  {reply}
                </button>
              ))}
            </div>
            <label htmlFor="reply" style={{ display: "block", fontWeight: 700, marginBottom: "0.45rem" }}>
              Reply
            </label>
            <textarea
              id="reply"
              rows={3}
              placeholder="Write a message..."
              style={{
                width: "100%",
                resize: "vertical",
                border: "1px solid #2a3765",
                borderRadius: 8,
                background: "#0f162c",
                color: "#f2f5ff",
                padding: "0.75rem"
              }}
            />
          </div>
        </article>
      </div>
    </section>
  );
}
