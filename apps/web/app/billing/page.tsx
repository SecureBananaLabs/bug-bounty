export default function BillingPage() {
  const overview = [
    { label: "Available balance", value: "$12,480", detail: "Ready to withdraw" },
    { label: "Escrow pending", value: "$3,250", detail: "12 active milestones" },
    { label: "Next payout", value: "Fri, Jun 7", detail: "Scheduled at 9:00 AM" },
    { label: "Payout method", value: "Bank transfer", detail: "Verified ending in 4812" }
  ];

  const invoices = [
    { id: "INV-2048", amount: "$1,500", status: "Paid", date: "Jun 3" },
    { id: "INV-2049", amount: "$900", status: "Pending", date: "Jun 4" },
    { id: "INV-2050", amount: "$2,250", status: "Scheduled", date: "Jun 6" }
  ];

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h2>Billing</h2>
        <p>Scan cashflow, payout timing, and invoice status without digging through the backend.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overview.map((item) => (
          <article className="card" key={item.label}>
            <p>{item.label}</p>
            <h3>{item.value}</h3>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="card">
          <h3>Recent invoices</h3>
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.id}</td>
                  <td>{invoice.amount}</td>
                  <td>{invoice.status}</td>
                  <td>{invoice.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="card">
          <h3>Payout setup</h3>
          <ul>
            <li>Primary method: bank transfer</li>
            <li>Reserve buffer: $2,000</li>
            <li>Auto payout threshold: $5,000</li>
            <li>Tax form status: complete</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
