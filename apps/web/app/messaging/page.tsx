"use client";
import { useState } from "react";

const MOCK_CONVERSATIONS = [
  { id: "c1", with: "alice-dev", lastMessage: "Can you share the repo access?",  time: "2 min ago",  unread: 2 },
  { id: "c2", with: "bob-client", lastMessage: "Invoice has been sent.",          time: "1 hr ago",   unread: 0 },
  { id: "c3", with: "carol-white", lastMessage: "Proposal looks great, accepted!", time: "Yesterday", unread: 1 },
];

const MOCK_MESSAGES: Record<string, { from: string; text: string; time: string }[]> = {
  c1: [
    { from: "alice-dev",  text: "Hi! I just pushed the first commit.",          time: "10:01" },
    { from: "me",         text: "Great, I'll review it today.",                  time: "10:05" },
    { from: "alice-dev",  text: "Can you share the repo access?",               time: "10:10" },
  ],
  c2: [
    { from: "bob-client", text: "Project is looking solid.",                     time: "09:00" },
    { from: "me",         text: "Invoice has been sent.",                        time: "09:15" },
  ],
  c3: [
    { from: "carol-white", text: "I reviewed your proposal.",                   time: "Yesterday" },
    { from: "carol-white", text: "Proposal looks great, accepted!",             time: "Yesterday" },
  ],
};

export default function MessagingPage() {
  const [active, setActive] = useState("c1");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(MOCK_MESSAGES);

  const send = () => {
    if (!input.trim()) return;
    setMessages(prev => ({
      ...prev,
      [active]: [...(prev[active] ?? []), { from: "me", text: input.trim(), time: "now" }]
    }));
    setInput("");
  };

  const conv = MOCK_CONVERSATIONS.find(c => c.id === active);

  return (
    <main style={{ display: "flex", height: "80vh", fontFamily: "sans-serif", border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
      {/* Sidebar */}
      <aside style={{ width: 260, borderRight: "1px solid #ddd", overflowY: "auto" }}>
        <h3 style={{ padding: "1rem", margin: 0, borderBottom: "1px solid #eee" }}>Messages</h3>
        {MOCK_CONVERSATIONS.map(c => (
          <div key={c.id} onClick={() => setActive(c.id)}
            style={{ padding: "0.75rem 1rem", cursor: "pointer", background: active === c.id ? "#eef4ff" : "transparent",
              borderLeft: active === c.id ? "3px solid #5468ff" : "3px solid transparent" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{c.with}</strong>
              {c.unread > 0 && <span style={{ background: "#5468ff", color: "#fff", borderRadius: 99, padding: "0.1rem 0.4rem", fontSize: "0.75rem" }}>{c.unread}</span>}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.2rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.lastMessage}</div>
            <div style={{ fontSize: "0.75rem", color: "#aaa" }}>{c.time}</div>
          </div>
        ))}
      </aside>

      {/* Chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>{conv?.with}</div>
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {(messages[active] ?? []).map((m, i) => (
            <div key={i} style={{ alignSelf: m.from === "me" ? "flex-end" : "flex-start",
              background: m.from === "me" ? "#5468ff" : "#f0f0f0",
              color: m.from === "me" ? "#fff" : "#000",
              padding: "0.5rem 0.75rem", borderRadius: 12, maxWidth: "70%" }}>
              <div>{m.text}</div>
              <div style={{ fontSize: "0.7rem", marginTop: "0.2rem", opacity: 0.7 }}>{m.time}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", padding: "0.75rem", borderTop: "1px solid #ddd" }}>
          <input aria-label="Message input" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Type a message…" style={{ flex: 1, padding: "0.5rem", borderRadius: 8, border: "1px solid #ddd" }} />
          <button onClick={send} style={{ cursor: "pointer", padding: "0.5rem 1rem", background: "#5468ff", color: "#fff", border: "none", borderRadius: 8 }}>Send</button>
        </div>
      </div>
    </main>
  );
}
