import Link from "next/link";

const notifications = [
  {
    id: "proposal-shortlist",
    type: "Proposal",
    title: "Maya Dev was shortlisted",
    body: "Your AI support widget job has a new shortlist recommendation.",
    time: "8 min ago",
    unread: true
  },
  {
    id: "message-follow-up",
    type: "Message",
    title: "Jordan UX sent a follow-up",
    body: "The onboarding wireframes are ready for your review.",
    time: "32 min ago",
    unread: true
  },
  {
    id: "billing-receipt",
    type: "Billing",
    title: "Milestone invoice paid",
    body: "Invoice INV-1042 was paid from your default billing method.",
    time: "Yesterday",
    unread: false
  },
  {
    id: "job-flag",
    type: "Trust",
    title: "Job listing needs one clarification",
    body: "Add deliverable details before publishing the SaaS onboarding project.",
    time: "Yesterday",
    unread: false
  }
];

type SearchParams = {
  filter?: string;
  read?: string;
};

type NotificationsPageProps = {
  searchParams?: Promise<SearchParams> | SearchParams;
};

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const params = await Promise.resolve(searchParams ?? {});
  const filter = params.filter === "unread" ? "unread" : "all";
  const read = params.read;
  const notificationState = notifications.map((notification) => ({
    ...notification,
    unread: read === "all" || read === notification.id ? false : notification.unread
  }));
  const unreadCount = notificationState.filter((notification) => notification.unread).length;
  const visibleNotifications = notificationState.filter(
    (notification) => filter === "all" || notification.unread
  );

  return (
    <section>
      <div className="card">
        <div className="notificationsHeader">
          <div>
            <h2>Notifications</h2>
            <p>{unreadCount} unread updates across proposals, messages, billing, and trust checks.</p>
          </div>
          <form action="/notifications">
            <input name="read" type="hidden" value="all" />
            <input name="filter" type="hidden" value={filter} />
            <button className="button" type="submit" disabled={unreadCount === 0}>
              Mark all read
            </button>
          </form>
        </div>
        <div className="segmentedControl" aria-label="Notification filter">
          <Link className={filter === "all" ? "segment active" : "segment"} href="/notifications">
            All
          </Link>
          <Link className={filter === "unread" ? "segment active" : "segment"} href="/notifications?filter=unread">
            Unread
          </Link>
        </div>
      </div>

      <div className="notificationList" aria-live="polite">
        {visibleNotifications.length === 0 ? (
          <article className="card">
            <h3>No unread notifications</h3>
            <p>All caught up for now.</p>
          </article>
        ) : (
          visibleNotifications.map((notification) => (
            <article
              className={notification.unread ? "card notificationItem unread" : "card notificationItem"}
              key={notification.id}
            >
              <div>
                <div className="notificationMeta">
                  <span>{notification.type}</span>
                  <span>{notification.time}</span>
                </div>
                <h3>{notification.title}</h3>
                <p>{notification.body}</p>
              </div>
              <form action="/notifications">
                <input name="read" type="hidden" value={notification.id} />
                <input name="filter" type="hidden" value={filter} />
                <button className="button secondary" type="submit" disabled={!notification.unread}>
                  {notification.unread ? "Mark read" : "Read"}
                </button>
              </form>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
