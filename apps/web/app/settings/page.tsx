import Link from "next/link";

const accountSettings = [
  { label: "Display name", value: "Avery Client" },
  { label: "Account type", value: "Client workspace" },
  { label: "Profile visibility", value: "Visible to matched freelancers" },
  { label: "Timezone", value: "America/New_York" }
];

const notificationSettings = [
  { label: "Proposal updates", value: "Email and in-app" },
  { label: "Message alerts", value: "In-app only" },
  { label: "Billing alerts", value: "Email required" },
  { label: "Weekly digest", value: "Paused" }
];

const securitySettings = [
  { label: "Password", value: "Updated 18 days ago", status: "Current" },
  { label: "Two-step verification", value: "Authenticator app", status: "Enabled" },
  { label: "Active sessions", value: "2 trusted devices", status: "Review" },
  { label: "API access", value: "No personal tokens", status: "Locked" }
];

const billingSettings = [
  { label: "Default payment method", value: "Visa ending in 4242" },
  { label: "Payout profile", value: "Bank transfer verified" },
  { label: "Tax form", value: "W-9 on file" },
  { label: "Invoice delivery", value: "billing@example.com" }
];

export default function SettingsPage() {
  return (
    <section className="settings-shell" aria-labelledby="settings-title">
      <div className="settings-header">
        <div>
          <p className="settings-kicker">Account settings</p>
          <h2 id="settings-title">Settings</h2>
          <p>Profile visibility, notification delivery, security posture, and billing defaults for the active workspace.</p>
        </div>
        <span className="settings-status">Workspace healthy</span>
      </div>

      <div className="settings-summary" aria-label="Settings summary">
        <SummaryMetric label="Profile" value="Public" />
        <SummaryMetric label="Security" value="2FA on" />
        <SummaryMetric label="Billing" value="Verified" />
        <SummaryMetric label="Alerts" value="3 active" />
      </div>

      <div className="settings-grid">
        <SettingsPanel
          title="Account / profile"
          description="Core identity and marketplace visibility."
          href="/"
          action="View workspace"
          rows={accountSettings}
        />
        <SettingsPanel
          title="Notifications"
          description="Delivery preferences for marketplace events."
          href="/notifications"
          action="Open alerts"
          rows={notificationSettings}
        />
        <SettingsPanel
          title="Security"
          description="Access safeguards and session state."
          rows={securitySettings}
        />
        <SettingsPanel
          title="Billing / payouts"
          description="Default payment, payout, tax, and invoice details."
          href="/billing"
          action="Review billing"
          rows={billingSettings}
        />
      </div>
    </section>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="settings-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function SettingsPanel({
  title,
  description,
  href,
  action,
  rows
}: {
  title: string;
  description: string;
  href?: string;
  action?: string;
  rows: Array<{ label: string; value: string; status?: string }>;
}) {
  return (
    <article className="settings-panel">
      <header className="settings-panel-header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        {href && action ? <Link href={href}>{action}</Link> : null}
      </header>
      <dl className="settings-list">
        {rows.map((row) => (
          <div className="settings-row" key={row.label}>
            <dt>{row.label}</dt>
            <dd>
              <span>{row.value}</span>
              {row.status ? <em>{row.status}</em> : null}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
