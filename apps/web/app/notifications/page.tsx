"use client";

import { useMemo, useState } from "react";

type NotificationKind = "Proposal" | "Message" | "Billing" | "System";

type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  time: string;
  unread: boolean;
  action: string;
};

const initialNotifications: NotificationItem[] = [
  {
    id: "ntf-101",
    kind: "Proposal",
    title: "New proposal on API migration",
    detail: "Jordan Miles sent a 4 milestone bid for the Node.js migration brief.",
    time: "12 min ago",
    unread: true,
    action: "Review proposal"
  },
  {
    id: "ntf-102",
    kind: "Message",
    title: "Maya Dev replied",
    detail: "The onboarding flow estimate now includes analytics tagging.",
    time: "38 min ago",
    unread: true,
    action: "Open thread"
  },
  {
    id: "ntf-103",
    kind: "Billing",
    title: "Milestone invoice ready",
    detail: "Invoice FF-2041 is ready for review before payout release.",
    time: "2 hours ago",
    unread: false,
    action: "View billing"
  },
  {
    id: "ntf-104",
    kind: "System",
    title: "Profile visibility updated",
    detail: "Your freelancer search profile is visible to verified clients.",
    time: "Yesterday",
    unread: false,
    action: "Open settings"
  }
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((item) => item.unread).length;
  const visibleNotifications = useMemo(
    () => notifications.filter((item) => filter === "all" || item.unread),
    [filter, notifications]
  );

  function markRead(id: string) {
    setNotifications((items) =>
      items.map((item) => (item.id === id ? { ...item, unread: false } : item))
    );
  }

  function markAllRead() {
    setNotifications((items) => items.map((item) => ({ ...item, unread: false })));
  }

  return (
    <section className="notifications-shell">
      <div className="notifications-header">
        <div>
          <p className="eyebrow">Notifications</p>
          <h2>Action feed</h2>
        </div>
        <div className="notification-count">
          <strong>{unreadCount}</strong>
          <span>Unread</span>
        </div>
      </div>

      <div className="notification-toolbar" aria-label="Notification filters">
        <div className="segmented-control">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
            type="button"
          >
            All
          </button>
          <button
            className={filter === "unread" ? "active" : ""}
            onClick={() => setFilter("unread")}
            type="button"
          >
            Unread
          </button>
        </div>
        <button className="secondary-button" onClick={markAllRead} type="button">
          Mark all read
        </button>
      </div>

      <div className="notification-list">
        {visibleNotifications.map((item) => (
          <article className="notification-row" data-unread={item.unread} key={item.id}>
            <div className="notification-marker" aria-hidden="true" />
            <div className="notification-body">
              <div className="notification-meta">
                <span>{item.kind}</span>
                <span>{item.time}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </div>
            <div className="notification-actions">
              <button type="button">{item.action}</button>
              {item.unread ? (
                <button className="ghost-button" onClick={() => markRead(item.id)} type="button">
                  Mark read
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
