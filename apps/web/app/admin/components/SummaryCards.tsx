import type { AdminDashboardData } from "../../../lib/adminTypes";

type Props = {
  metrics: AdminDashboardData["metrics"];
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

export function SummaryCards({ metrics }: Props) {
  const cards = [
    { label: "Total users", value: metrics.totalUsers.toLocaleString("en-US") },
    { label: "Active jobs", value: metrics.activeJobs.toLocaleString("en-US") },
    { label: "Open disputes", value: metrics.openDisputes.toLocaleString("en-US") },
    { label: "Flagged listings", value: metrics.flaggedListings.toLocaleString("en-US") },
    { label: "Revenue", value: currencyFormatter.format(metrics.revenueCurrentPeriod) }
  ];

  return (
    <section className="admin-summary-grid" aria-label="Admin summary">
      {cards.map((card) => (
        <article className="admin-metric-card" key={card.label}>
          <span>{card.label}</span>
          <strong>{card.value}</strong>
        </article>
      ))}
    </section>
  );
}
