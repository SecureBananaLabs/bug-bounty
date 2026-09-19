export default function NotificationsPage() {
  const notifications = [
    { id: "ntf_001", title: "New proposal received", body: "maya-dev submitted a proposal for 'Build an AI customer support widget'", time: "2 min ago", read: false },
    { id: "ntf_002", title: "Payment processed", body: "Invoice inv_002 for $1,200.00 has been paid", time: "1 hr ago", read: false },
    { id: "ntf_003", title: "Job application accepted", body: "Your proposal for 'Migrate legacy API to Node.js' has been accepted", time: "3 hr ago", read: true },
    { id: "ntf_004", title: "New message from jordan-ux", body: "Can we schedule a call to discuss the project requirements?", time: "1 day ago", read: true },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h2>Notifications</h2>
      {notifications.map((n) => (
        <section key={n.id} className="card" style={{ borderLeft: n.read ? "3px solid #ddd" : "3px solid #5468ff", opacity: n.read ? 0.8 : 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{n.title}</strong>
            <span style={{ fontSize: "0.8rem", color: "#999" }}>{n.time}</span>
          </div>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem" }}>{n.body}</p>
          {!n.read && <span style={{ fontSize: "0.75rem", color: "#5468ff" }}>● Unread</span>}
        </section>
      ))}
    </div>
  );
}
