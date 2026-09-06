const mockNotifications = [
  { id: "ntf-1", message: "Your proposal was accepted for \"Build an AI widget\".", read: false },
  { id: "ntf-2", message: "New message from maya-dev.", read: true },
  { id: "ntf-3", message: "Invoice #inv-002 is due.", read: false }
];

export default function NotificationsPage() {
  return (
    <section className="card">
      <h2>Notifications</h2>
      <ul>
        {mockNotifications.map(n => (
          <li key={n.id} style={{ fontWeight: n.read ? "normal" : "bold" }}>
            {n.message} {!n.read && <span style={{ color: "blue" }}>(unread)</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
