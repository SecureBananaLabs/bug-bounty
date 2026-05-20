"use client";

type ToggleProps = {
  label: string;
  enabled: boolean;
  onChange?: (next: boolean) => void;
};

export function ConfirmToggle({ label, enabled, onChange }: ToggleProps) {
  return (
    <button
      className="admin-toggle"
      type="button"
      aria-pressed={enabled}
      aria-label={`Toggle ${label}`}
      onClick={() => {
        const next = !enabled;
        const ok = window.confirm(
          `${next ? "Enable" : "Disable"} ${label}? This action will be logged with your admin ID.`
        );

        if (ok) {
          onChange?.(next);
        }
      }}
    >
      {enabled ? "On" : "Off"}
    </button>
  );
}

type ActionButtonsProps = {
  subject: string;
  actions: string[];
};

export function ConfirmActions({ subject, actions }: ActionButtonsProps) {
  return (
    <div className="button-row">
      {actions.map((action) => (
        <button
          key={action}
          className="admin-button secondary"
          type="button"
          onClick={() => {
            window.confirm(`Apply ${action} to ${subject}?`);
          }}
          aria-label={`${action} ${subject}`}
        >
          {action}
        </button>
      ))}
    </div>
  );
}
