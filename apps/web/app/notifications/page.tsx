const notifications = [
  {
    id: "ntf-1",
    type: "Proposal",
    description: "maya-dev submitted a proposal on 'Build an AI customer support widget'",
    timestamp: "2024-06-10 15:00",
    read: false
  },
  {
    id: "ntf-2",
    type: "Message",
    description: "jordan-ux sent you a message",
    timestamp: "2024-06-10 09:20",
    read: false
  },
  {
    id: "ntf-3",
    type: "Billing",
    description: "Invoice #inv-002 of $800 is pending payment",
    timestamp: "2024-06-09 12:00",
    read: true
  },
  {
    id: "ntf-4",
    type: "Proposal",
    description: "Your proposal on 'Migrate legacy API to Node.js' was accepted",
    timestamp: "2024-06-08 16:45",
    read: true
  }
];

export default function NotificationsPage() {
  return (
    <section>
      <h2>Notifications</h2>
      <div className="grid">
        {notifications.map((notif) => (
          <article className="card" key={notif.id}>
            <h3>
              {notif.type}
              {!notif.read && <span> 🔵</span>}
            </h3>
            <p>{notif.description}</p>
            <p>{notif.timestamp}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
