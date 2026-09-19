type Props = {
  controls: {
    registrationsEnabled: boolean;
    jobPostingsEnabled: boolean;
  };
  onToggle: (key: "registrationsEnabled" | "jobPostingsEnabled") => void;
};

export function PlatformControls({ controls, onToggle }: Props) {
  const items = [
    { key: "registrationsEnabled" as const, label: "New registrations" },
    { key: "jobPostingsEnabled" as const, label: "New job postings" }
  ];

  return (
    <section className="admin-section" id="admin-controls" aria-labelledby="admin-controls-title">
      <div className="admin-section-heading">
        <div>
          <p className="admin-eyebrow">Platform controls</p>
          <h2 id="admin-controls-title">Availability</h2>
        </div>
      </div>
      <div className="admin-control-list">
        {items.map((item) => (
          <label className="admin-toggle" key={item.key}>
            <span>{item.label}</span>
            <input
              type="checkbox"
              checked={controls[item.key]}
              onChange={() => onToggle(item.key)}
              aria-label={`Toggle ${item.label}`}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
