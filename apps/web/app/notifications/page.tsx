"use client";
import { useState } from "react";

const MOCK_NOTIFICATIONS = [
  { id: "n1", type: "proposal",  message: "alice-dev submitted a proposal on 'Build AI Widget'",    time: "2 min ago",  read: false },
  { id: "n2", type: "message",   message: "bob-client sent you a message",                          time: "15 min ago", read: false },
  { id: "n3", type: "billing",   message: "Payment of $1,500 released for 'Website Redesign'",      time: "1 hr ago",   read: false },
  { id: "n4", type: "proposal",  message: "Your proposal on 'Migrate API' was accepted",            time: "3 hrs ago",  read: true  },
  { id: "n5", type: "billing",   message: "Invoice inv-002 marked as paid",                         time: "1 day ago",  read: true  },
];

const ICONS: Record<string, string> = { proposal: "📋", message: "💬", billing: "💳" };

export default function NotificationsPage() {
  const [notes, setNotes] = useState(MOCK_NOTIFICATIONS);

  const markAllRead = () => setNotes(n => n.map(x => ({ ...x, read: true })));
  const markRead = (id: string) => setNotes(n => n.map(x => x.id === id ? { ...x, read: true } : x));

  const unread = notes.filter(n => !n.read).length;

  return (
    <main style={{ padding: "1.5rem", maxWidth: 700, margin: "0 auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Notifications {unread > 0 && <span style={{ fontSize: "1rem", background: "#e85", color: "#fff", borderRadius: 99, padding: "0.1rem 0.5rem" }}>{unread}</span>}</h1>
        <button onClick={markAllRead} disabled={unread === 0} style={{ cursor: "pointer" }}>Mark all read</button>
      </div>
      {notes.length === 0
        ? <p>No notifications.</p>
        : notes.map(n => (
          <div key={n.id} onClick={() => markRead(n.id)}
            style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.75rem 1rem",
              background: n.read ? "#f9f9f9" : "#eef4ff", borderRadius: 8, marginBottom: "0.5rem",
              cursor: "pointer", borderLeft: n.read ? "3px solid transparent" : "3px solid #5468ff" }}>
            <span style={{ fontSize: "1.4rem" }}>{ICONS[n.type] ?? "🔔"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: n.read ? "normal" : "bold" }}>{n.message}</div>
              <div style={{ fontSize: "0.8rem", color: "#888", marginTop: "0.2rem" }}>{n.time}</div>
            </div>
            {!n.read && <span style={{ color: "#5468ff", fontSize: "0.75rem", fontWeight: "bold" }}>NEW</span>}
          </div>
        ))
      }
    </main>
  );
}
