const MOCK_NOTIFICATIONS = [
  { id: "ntf_001", type: "proposal", message: "Alice Chen submitted a proposal for 'Build React Dashboard'", time: "5m ago", read: false },
  { id: "ntf_002", type: "payment", message: "Payment of $400 released for 'API Integration'", time: "2h ago", read: false },
  { id: "ntf_003", type: "message", message: "New message from Bob Martinez", time: "Yesterday", read: true }
];

export default function NotificationsPage() {
  return (
    <section className="card">
      <h2>Notifications</h2>
      <ul>
        {MOCK_NOTIFICATIONS.map(n => (
          <li key={n.id} style={{ marginBottom: "12px", opacity: n.read ? 0.6 : 1 }}>
            <span style={{ fontWeight: n.read ? "normal" : "bold" }}>{n.message}</span>
            <span style={{ color: "#888", marginLeft: "8px" }}>{n.time}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
