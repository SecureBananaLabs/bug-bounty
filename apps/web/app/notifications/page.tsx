export default function NotificationsPage() {
  const metrics = [
    { label: "Unread alerts", value: "12", detail: "6 from active projects" },
    { label: "Action needed", value: "4", detail: "Due before end of day" },
    { label: "Billing notices", value: "2", detail: "Invoices ready to review" },
  ];

  const notifications = [
    {
      category: "Proposal",
      title: "Client shortlisted your marketplace redesign bid",
      time: "12 min ago",
      status: "Unread",
      action: "Review brief",
    },
    {
      category: "Message",
      title: "Maya Chen sent a new attachment in Brand Refresh",
      time: "34 min ago",
      status: "Reply today",
      action: "Open thread",
    },
    {
      category: "Billing",
      title: "Invoice INV-1048 is approved and ready for payout",
      time: "1 hr ago",
      status: "Ready",
      action: "View invoice",
    },
    {
      category: "Task",
      title: "Final handoff checklist is waiting on your review",
      time: "3 hrs ago",
      status: "Blocked",
      action: "Resolve items",
    },
  ];

  const nextActions = [
    "Reply to two client messages marked urgent",
    "Confirm payout details for approved invoices",
    "Clear blocked handoff tasks before the weekly digest",
  ];

  return (
    <>
      <section className="card">
        <p style={{ margin: "0 0 0.35rem", color: "#93a4d7", fontWeight: 700 }}>
          Notification center
        </p>
        <h2 style={{ margin: "0 0 0.5rem" }}>Actionable alert feed</h2>
        <p style={{ margin: 0, color: "#c8d2f2", maxWidth: "680px" }}>
          Track proposal activity, unread messages, task blockers, and billing updates in
          one prioritized workspace.
        </p>
      </section>

      <section className="grid" aria-label="Notification summary">
        {metrics.map((metric) => (
          <article className="card" key={metric.label}>
            <p style={{ margin: 0, color: "#9fb0e2", fontSize: "0.88rem" }}>
              {metric.label}
            </p>
            <strong style={{ display: "block", marginTop: "0.35rem", fontSize: "2rem" }}>
              {metric.value}
            </strong>
            <p style={{ margin: "0.35rem 0 0", color: "#c8d2f2" }}>{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: "1rem",
          }}
        >
          <div>
            <h3 style={{ margin: "0 0 0.25rem" }}>Priority feed</h3>
            <p style={{ margin: 0, color: "#aebce7" }}>
              Sorted by urgency, unread status, and payout impact.
            </p>
          </div>
          <span
            style={{
              border: "1px solid #465894",
              borderRadius: "999px",
              padding: "0.35rem 0.75rem",
              color: "#d7def8",
              fontSize: "0.9rem",
            }}
          >
            4 open actions
          </span>
        </div>

        <div style={{ display: "grid", gap: "0.75rem" }}>
          {notifications.map((notification) => (
            <article
              key={notification.title}
              style={{
                border: "1px solid #2a3765",
                borderRadius: "8px",
                padding: "0.9rem",
                background: "#111832",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ maxWidth: "620px" }}>
                  <p
                    style={{
                      margin: "0 0 0.3rem",
                      color: "#95e6c8",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                    }}
                  >
                    {notification.category} - {notification.time}
                  </p>
                  <h4 style={{ margin: 0 }}>{notification.title}</h4>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong style={{ display: "block", color: "#f7d878" }}>
                    {notification.status}
                  </strong>
                  <p style={{ margin: "0.3rem 0 0", color: "#c8d2f2" }}>
                    {notification.action}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h3 style={{ margin: "0 0 0.75rem" }}>Next actions</h3>
        <div style={{ display: "grid", gap: "0.65rem" }}>
          {nextActions.map((action, index) => (
            <div
              key={action}
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "center",
                border: "1px solid #2a3765",
                borderRadius: "8px",
                padding: "0.75rem",
                background: "#10172d",
              }}
            >
              <strong
                style={{
                  display: "inline-grid",
                  placeItems: "center",
                  width: "2rem",
                  height: "2rem",
                  borderRadius: "999px",
                  background: "#24345f",
                  color: "#f2f5ff",
                  flex: "0 0 auto",
                }}
              >
                {index + 1}
              </strong>
              <span style={{ color: "#d7def8" }}>{action}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
