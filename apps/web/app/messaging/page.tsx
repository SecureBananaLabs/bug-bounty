export default function MessagingPage() {
  const conversations = [
    { id: "conv_001", with: "maya-dev", lastMessage: "Sounds good, I'll start on the widget tomorrow.", time: "5 min ago", unread: 2 },
    { id: "conv_002", with: "jordan-ux", lastMessage: "Can we schedule a call to discuss the project requirements?", time: "1 hr ago", unread: 1 },
    { id: "conv_003", with: "SecureClient", lastMessage: "The milestone has been approved. Payment released.", time: "2 days ago", unread: 0 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h2>Messaging</h2>
      {conversations.map((c) => (
        <section key={c.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>{c.with}</strong>
            {c.unread > 0 && <span style={{ marginLeft: "0.5rem", background: "#5468ff", color: "white", borderRadius: "999px", padding: "0 0.4rem", fontSize: "0.75rem" }}>{c.unread}</span>}
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.9rem", color: "#555" }}>{c.lastMessage}</p>
          </div>
          <span style={{ fontSize: "0.8rem", color: "#999", whiteSpace: "nowrap" }}>{c.time}</span>
        </section>
      ))}
    </div>
  );
}
