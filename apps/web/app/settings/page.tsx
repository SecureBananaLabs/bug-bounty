import Link from "next/link";

const accountControls = [
  { label: "Profile visibility", value: "Public", status: "Good to go", action: "Edit profile" },
  { label: "Notifications", value: "Email + in-app", status: "3 alerts enabled", action: "Tune alerts" },
  { label: "Security", value: "2FA on", status: "Recovery codes saved", action: "Review security" },
  { label: "Billing / payouts", value: "Bank transfer", status: "Payout threshold $5,000", action: "Update payout method" }
];

export default function SettingsPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h2>Settings</h2>
        <p>Account preferences, profile visibility, security controls, and payout setup.</p>
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        {accountControls.map((control) => (
          <article className="card space-y-3" key={control.label}>
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">{control.label}</h3>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">{control.status}</span>
            </div>
            <p className="text-slate-600">Current: {control.value}</p>
            <Link className="inline-flex rounded border border-slate-300 px-4 py-2 text-sm" href="#">
              {control.action}
            </Link>
          </article>
        ))}
      </div>

      <article className="card space-y-3">
        <h3 className="text-lg font-semibold">Account controls</h3>
        <ul className="grid gap-2 md:grid-cols-2 text-slate-700">
          <li>• Change password</li>
          <li>• Manage connected accounts</li>
          <li>• Toggle profile visibility</li>
          <li>• Adjust invoice notifications</li>
          <li>• Verify payout destination</li>
          <li>• Download security recovery codes</li>
        </ul>
      </article>
    </section>
  );
}
