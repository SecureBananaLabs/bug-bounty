const mockConversations = [
  { id: "conv-1", participant: "maya-dev", lastMessage: "Sure, I can start on Monday.", unread: 2 },
  { id: "conv-2", participant: "jordan-ux", lastMessage: "Please review the wireframes.", unread: 0 },
  { id: "conv-3", participant: "client-bob", lastMessage: "Contract signed. Let's go!", unread: 1 }
];

export default function MessagingPage() {
  return (
    <section className="card">
      <h2>Messaging</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {mockConversations.map(c => (
          <li key={c.id} style={{ padding: "0.75rem 0", borderBottom: "1px solid #eee" }}>
            <strong>{c.participant}</strong>
            {c.unread > 0 && (
              <span style={{ marginLeft: 8, background: "#5468ff", color: "white", borderRadius: 12, padding: "2px 8px", fontSize: 12 }}>
                {c.unread}
              </span>
            )}
            <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>{c.lastMessage}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
