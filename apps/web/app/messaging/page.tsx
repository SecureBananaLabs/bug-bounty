const MOCK_CONVERSATIONS = [
  { id: "conv_001", with: "Alice Chen", lastMessage: "Sounds good! I'll start Monday.", time: "2m ago", unread: 2 },
  { id: "conv_002", with: "Bob Martinez", lastMessage: "Can you share the repo link?", time: "1h ago", unread: 0 },
  { id: "conv_003", with: "Sara Kim", lastMessage: "Payment released, thanks!", time: "Yesterday", unread: 0 }
];

export default function MessagingPage() {
  return (
    <section className="card">
      <h2>Messaging</h2>
      <ul>
        {MOCK_CONVERSATIONS.map(c => (
          <li key={c.id} style={{ marginBottom: "12px" }}>
            <strong>{c.with}</strong>
            {c.unread > 0 && <span> ({c.unread} unread)</span>}
            <br />
            <span>{c.lastMessage}</span>
            <span style={{ color: "#888", marginLeft: "8px" }}>{c.time}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
