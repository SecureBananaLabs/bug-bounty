const notifications = [
  {
    category: "Proposal",
    message: "Maya Chen submitted a revised milestone estimate.",
    time: "8 min ago",
    status: "Unread",
    action: "Review estimate",
    urgent: true
  },
  {
    category: "Message",
    message: "Jordan Lee replied in the onboarding flow thread.",
    time: "42 min ago",
    status: "Unread",
    action: "Open thread",
    urgent: true
  },
  {
    category: "Billing",
    message: "Invoice FF-1042 was marked as paid.",
    time: "Yesterday",
    status: "Resolved",
    action: "View receipt",
    urgent: false
  }
];

export default function NotificationsPage() {
  const unreadCount = notifications.filter((item) => item.status === "Unread").length;
  const actionCount = notifications.filter((item) => item.urgent).length;

  return (
    <section>
      <h2>Notifications</h2>

      <div className="grid">
        <article className="card">
          <h3>Unread</h3>
          <p>{unreadCount} updates need attention</p>
        </article>
        <article className="card">
          <h3>Action Needed</h3>
          <p>{actionCount} items have next steps</p>
        </article>
        <article className="card">
          <h3>Latest Alert</h3>
          <p>{notifications[0].time}</p>
        </article>
      </div>

      <section className="card">
        <h3>Alert Feed</h3>
        {notifications.map((notification) => (
          <article key={`${notification.category}-${notification.message}`} className="card">
            <h4>{notification.category}</h4>
            <p>{notification.message}</p>
            <p>
              <strong>{notification.status}</strong> · {notification.time}
            </p>
            <button type="button">{notification.action}</button>
          </article>
        ))}
      </section>
    </section>
  );
}
