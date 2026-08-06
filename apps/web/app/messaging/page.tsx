export default function MessagingPage() {
  const conversations = [
    {
      name: "Maya Chen",
      project: "AI support widget",
      preview: "Shared the revised milestone plan and QA checklist.",
      status: "Unread",
      time: "8 min"
    },
    {
      name: "Jordan UX",
      project: "SaaS onboarding flow",
      preview: "Sent two prototype links for review.",
      status: "Waiting",
      time: "42 min"
    },
    {
      name: "Cedar Systems",
      project: "API migration",
      preview: "Confirmed staging credentials and deploy window.",
      status: "Replied",
      time: "2 hr"
    }
  ];

  const thread = [
    { author: "Maya Chen", body: "I split the widget delivery into discovery, prototype, and QA milestones." },
    { author: "You", body: "That works. Please add the browser support matrix before we approve the first milestone." },
    { author: "Maya Chen", body: "Added. I also included risks for the CRM embed and handoff notes." }
  ];

  return (
    <section>
      <div className="card messaging-hero">
        <p className="messaging-eyebrow">Inbox</p>
        <h2>Messaging</h2>
        <p>Track active conversations, unread items, and project context without leaving the marketplace.</p>
      </div>

      <div className="messaging-summary">
        <article className="card message-stat">
          <span>Unread</span>
          <strong>4</strong>
          <small>Across 3 projects</small>
        </article>
        <article className="card message-stat">
          <span>Avg response</span>
          <strong>18m</strong>
          <small>This week</small>
        </article>
        <article className="card message-stat">
          <span>Open threads</span>
          <strong>11</strong>
          <small>5 need follow-up</small>
        </article>
      </div>

      <div className="messaging-layout">
        <section className="card">
          <h3>Conversation queue</h3>
          <div className="message-list">
            {conversations.map((conversation) => (
              <article className="message-card" key={conversation.name}>
                <div>
                  <strong>{conversation.name}</strong>
                  <p>{conversation.project}</p>
                  <small>{conversation.preview}</small>
                </div>
                <div className="message-meta">
                  <span>{conversation.status}</span>
                  <small>{conversation.time}</small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>Selected thread</h3>
          <div className="thread">
            {thread.map((message) => (
              <article className="thread-message" key={`${message.author}-${message.body}`}>
                <strong>{message.author}</strong>
                <p>{message.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="card message-actions">
        <h3>Next actions</h3>
        <div>
          <span>Reply to Maya Chen</span>
          <span>Schedule prototype review</span>
          <span>Archive resolved API thread</span>
        </div>
      </section>
    </section>
  );
}
