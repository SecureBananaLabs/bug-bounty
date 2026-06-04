const threads = [
  {
    name: "Maya Chen",
    project: "AI customer support widget",
    preview: "I can send the revised milestone estimate today.",
    status: "Response needed",
    time: "12 min ago",
    unread: true
  },
  {
    name: "Jordan Lee",
    project: "SaaS onboarding flows",
    preview: "The second prototype is ready for client review.",
    status: "In review",
    time: "1 hr ago",
    unread: false
  },
  {
    name: "Priya Shah",
    project: "Node.js API migration",
    preview: "Can we confirm staging access before kickoff?",
    status: "Waiting on client",
    time: "Yesterday",
    unread: false
  }
];

export default function MessagingPage() {
  const unreadCount = threads.filter((thread) => thread.unread).length;

  return (
    <section>
      <h2>Messaging</h2>

      <div className="grid">
        <article className="card">
          <h3>Open threads</h3>
          <p>{threads.length} active conversations</p>
        </article>
        <article className="card">
          <h3>Needs reply</h3>
          <p>{unreadCount} unread client update</p>
        </article>
        <article className="card">
          <h3>Average response</h3>
          <p>38 minutes</p>
        </article>
      </div>

      <div className="grid">
        <section className="card">
          <h3>Conversation Queue</h3>
          {threads.map((thread) => (
            <article key={`${thread.name}-${thread.project}`} className="card">
              <h4>{thread.name}</h4>
              <p>{thread.project}</p>
              <p>{thread.preview}</p>
              <p>
                <strong>{thread.status}</strong> · {thread.time}
              </p>
            </article>
          ))}
        </section>

        <aside className="card">
          <h3>Quick Reply</h3>
          <p>Draft a focused update for the selected conversation.</p>
          <label htmlFor="reply">Message</label>
          <textarea
            id="reply"
            rows={6}
            defaultValue="Thanks for the update. I will review the milestone estimate and reply with next steps."
            style={{ width: "100%", marginTop: 8 }}
          />
          <button type="button" style={{ marginTop: 12 }}>
            Save draft
          </button>
        </aside>
      </div>
    </section>
  );
}
