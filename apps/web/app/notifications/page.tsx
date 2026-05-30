const notifications = [
  {
    id: "note-1",
    title: "Proposal accepted",
    source: "Marketplace onboarding flow",
    detail: "Maya Chen accepted the updated milestone terms.",
    time: "8 min ago",
    type: "Project",
    priority: "High",
    unread: true
  },
  {
    id: "note-2",
    title: "New message",
    source: "API audit",
    detail: "Owen Patel asked for the staging URL before running checks.",
    time: "23 min ago",
    type: "Message",
    priority: "Medium",
    unread: true
  },
  {
    id: "note-3",
    title: "Invoice paid",
    source: "Brand refresh",
    detail: "The client paid invoice INV-1042 for the first design milestone.",
    time: "Yesterday",
    type: "Billing",
    priority: "Low",
    unread: false
  },
  {
    id: "note-4",
    title: "Profile view spike",
    source: "Freelancer profile",
    detail: "Your profile received 18 views after the React skill update.",
    time: "Mon",
    type: "Growth",
    priority: "Low",
    unread: false
  }
];

const unreadCount = notifications.filter((notification) => notification.unread).length;
const highPriorityCount = notifications.filter((notification) => notification.priority === "High").length;

export default function NotificationsPage() {
  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ marginBottom: "0.35rem" }}>Notifications</h2>
          <p style={{ color: "#b8c3e6", margin: 0 }}>
            Review project updates, message alerts, and billing events in one triage feed.
          </p>
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
            padding: "0.6rem 0.9rem"
          }}
        >
          Mark all read
        </button>
      </div>

      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", margin: "1rem 0" }}>
        <article className="card" style={{ marginBottom: 0 }}>
          <p style={{ color: "#aab6db", margin: 0 }}>Unread</p>
          <strong style={{ display: "block", fontSize: "2rem", marginTop: "0.25rem" }}>{unreadCount}</strong>
        </article>
        <article className="card" style={{ marginBottom: 0 }}>
          <p style={{ color: "#aab6db", margin: 0 }}>High priority</p>
          <strong style={{ display: "block", fontSize: "2rem", marginTop: "0.25rem" }}>{highPriorityCount}</strong>
        </article>
        <article className="card" style={{ marginBottom: 0 }}>
          <p style={{ color: "#aab6db", margin: 0 }}>Total events</p>
          <strong style={{ display: "block", fontSize: "2rem", marginTop: "0.25rem" }}>{notifications.length}</strong>
        </article>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0 }}>Activity feed</h3>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {["All", "Unread", "Billing"].map((filter) => (
              <button
                key={filter}
                type="button"
                style={{
                  background: filter === "All" ? "#8fd6ff" : "#111830",
                  border: filter === "All" ? 0 : "1px solid #2a3765",
                  borderRadius: 8,
                  color: filter === "All" ? "#081224" : "#f2f5ff",
                  cursor: "pointer",
                  fontWeight: 700,
                  padding: "0.45rem 0.75rem"
                }}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: "0.85rem" }}>
          {notifications.map((notification) => (
            <article
              key={notification.id}
              style={{
                border: notification.unread ? "1px solid #8fd6ff" : "1px solid #2a3765",
                borderRadius: 8,
                padding: "0.9rem",
                background: notification.unread ? "#1b294a" : "#111830"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", flexWrap: "wrap" }}>
                    <strong>{notification.title}</strong>
                    {notification.unread ? (
                      <span
                        style={{
                          background: "#22c55e",
                          borderRadius: 999,
                          color: "#07120b",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          padding: "0.15rem 0.45rem"
                        }}
                      >
                        New
                      </span>
                    ) : null}
                  </div>
                  <p style={{ color: "#8fd6ff", margin: "0.35rem 0" }}>{notification.source}</p>
                </div>
                <span style={{ color: "#aab6db", whiteSpace: "nowrap" }}>{notification.time}</span>
              </div>

              <p style={{ color: "#d8def3", margin: "0 0 0.75rem" }}>{notification.detail}</p>

              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span style={{ color: "#aab6db" }}>{notification.type}</span>
                  <span style={{ color: notification.priority === "High" ? "#fbbf24" : "#aab6db" }}>
                    {notification.priority} priority
                  </span>
                </div>
                <button
                  type="button"
                  style={{
                    background: "#111830",
                    border: "1px solid #2a3765",
                    borderRadius: 8,
                    color: "#f2f5ff",
                    cursor: "pointer",
                    padding: "0.45rem 0.75rem"
                  }}
                >
                  Open item
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
