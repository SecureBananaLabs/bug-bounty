const threads = [
  {
    id: "thread-1",
    participant: "maya-dev",
    lastMessage: "Sounds good, I can start Monday.",
    timestamp: "2024-06-10 14:32",
    unread: true
  },
  {
    id: "thread-2",
    participant: "jordan-ux",
    lastMessage: "I've uploaded the revised wireframes.",
    timestamp: "2024-06-09 09:15",
    unread: false
  },
  {
    id: "thread-3",
    participant: "alex-backend",
    lastMessage: "The API is ready for review.",
    timestamp: "2024-06-08 17:44",
    unread: false
  }
];

export default function MessagingPage() {
  return (
    <section>
      <h2>Messaging</h2>
      <div className="grid">
        {threads.map((thread) => (
          <article className="card" key={thread.id}>
            <h3>
              {thread.participant}
              {thread.unread && <span> 🔵</span>}
            </h3>
            <p>{thread.lastMessage}</p>
            <p>{thread.timestamp}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
