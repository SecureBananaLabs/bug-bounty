export default function MessagingPage() {
  const summary = [
    ["Unread threads", "3", "2 client replies and 1 milestone note"],
    ["Average response", "18m", "Inside the 1 hour project SLA"],
    ["Open decisions", "4", "Awaiting scope, budget, or delivery approval"]
  ];

  const threads = [
    ["Maya Chen", "Checkout audit", "12m ago", "Unread"],
    ["Jordan Lee", "Design system sprint", "36m ago", "Reply due"],
    ["Riley Ops", "Billing workflow QA", "2h ago", "Resolved"]
  ];

  const messages = [
    ["Maya Chen", "I pushed the Stripe handoff notes and marked the refund edge case for review."],
    ["You", "I will check the acceptance notes and confirm the invoice milestone after QA."],
    ["Maya Chen", "Great. The demo clip is attached in the project thread."]
  ];

  const actions = ["Review handoff", "Approve milestone", "Request revision"];

  return (
    <section>
      <div className="card">
        <h2>Messaging</h2>
        <p>Track client threads, unread work, and reply decisions from one project inbox.</p>
      </div>

      <div className="grid">
        {summary.map(([label, value, detail]) => (
          <article className="card" key={label}>
            <p>{label}</p>
            <h3>{value}</h3>
            <p>{detail}</p>
          </article>
        ))}
      </div>

      <section>
        <h3>Active Threads</h3>
        <div className="grid">
          {threads.map(([person, project, time, status]) => (
            <article className="card" key={`${person}-${project}`}>
              <h4>{person}</h4>
              <p>{project}</p>
              <p>{time}</p>
              <strong>{status}</strong>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h3>Selected Conversation</h3>
        <div className="grid">
          {messages.map(([sender, body]) => (
            <article className="card" key={`${sender}-${body}`}>
              <h4>{sender}</h4>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h3>Next Actions</h3>
        <div className="grid">
          {actions.map((action) => (
            <article className="card" key={action}>
              <strong>{action}</strong>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
