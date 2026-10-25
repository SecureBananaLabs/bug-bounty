"use client";

import { useMemo, useState } from "react";

const initialNotifications = [
  {
    id: "proposal-shortlist",
    title: "Proposal shortlisted",
    body: "Maya Chen was shortlisted for the AI customer support widget project.",
    type: "Proposal",
    time: "10 minutes ago",
    read: false
  },
  {
    id: "message-thread",
    title: "New message",
    body: "Jordan UX sent a timeline update in the brand refresh thread.",
    type: "Message",
    time: "42 minutes ago",
    read: false
  },
  {
    id: "billing-milestone",
    title: "Milestone payment ready",
    body: "The dashboard redesign milestone is ready for billing review.",
    type: "Billing",
    time: "Today",
    read: true
  },
  {
    id: "proposal-expiring",
    title: "Proposal expires soon",
    body: "A saved proposal for the analytics pipeline job expires tomorrow.",
    type: "Proposal",
    time: "Yesterday",
    read: true
  }
];

type Filter = "all" | "unread";

const buttonStyle = {
  border: "1px solid #4f63a6",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 700,
  padding: "0.6rem 0.8rem"
};

const secondaryButtonStyle = {
  ...buttonStyle,
  background: "#0f162b",
  color: "#f2f5ff"
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<Filter>("all");

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const visibleNotifications = useMemo(
    () => notifications.filter((notification) => filter === "all" || !notification.read),
    [filter, notifications]
  );

  function markRead(id: string) {
    setNotifications((current) =>
      current.map((notification) => (notification.id === id ? { ...notification, read: true } : notification))
    );
  }

  function markAllRead() {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  }

  return (
    <section className="card" style={{ display: "grid", gap: "1rem" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <h2>Notifications</h2>
          <p style={{ color: "#b7c2e7", marginBottom: 0 }}>
            {unreadCount === 0 ? "All caught up." : `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}.`}
          </p>
        </div>
        <button type="button" onClick={markAllRead} style={secondaryButtonStyle} disabled={unreadCount === 0}>
          Mark All Read
        </button>
      </header>

      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        {(["all", "unread"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            style={{
              ...buttonStyle,
              background: filter === option ? "#f2f5ff" : "#0f162b",
              color: filter === option ? "#0b1020" : "#f2f5ff"
            }}
          >
            {option === "all" ? "All" : "Unread"}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gap: "0.8rem" }}>
        {visibleNotifications.length === 0 ? (
          <p style={{ border: "1px solid #2a3765", borderRadius: 8, padding: "1rem" }}>
            No unread notifications.
          </p>
        ) : (
          visibleNotifications.map((notification) => (
            <article
              key={notification.id}
              style={{
                background: notification.read ? "#10182e" : "#1c2545",
                border: `1px solid ${notification.read ? "#2a3765" : "#74c0fc"}`,
                borderRadius: 8,
                display: "grid",
                gap: "0.5rem",
                padding: "1rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                <strong>{notification.title}</strong>
                <span style={{ color: notification.read ? "#b7c2e7" : "#74c0fc" }}>
                  {notification.read ? "Read" : "Unread"}
                </span>
              </div>
              <p style={{ margin: 0 }}>{notification.body}</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                <span style={{ color: "#b7c2e7" }}>
                  {notification.type} - {notification.time}
                </span>
                {!notification.read ? (
                  <button type="button" onClick={() => markRead(notification.id)} style={secondaryButtonStyle}>
                    Mark Read
                  </button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
