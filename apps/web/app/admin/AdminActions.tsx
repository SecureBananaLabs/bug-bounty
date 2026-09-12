"use client";

type ToggleProps = {
  label: string;
  enabled: boolean;
  onChange?: (next: boolean) => void | Promise<void>;
  disabled?: boolean;
};

export function ConfirmToggle({ label, enabled, onChange, disabled = false }: ToggleProps) {
  return (
    <button
      className="admin-toggle"
      type="button"
      aria-pressed={enabled}
      aria-label={`Toggle ${label}`}
      disabled={disabled}
      onClick={() => {
        const next = !enabled;
        const ok = window.confirm(
          `${next ? "Enable" : "Disable"} ${label}? This action will be logged with your admin ID.`
        );

        if (ok) {
          void onChange?.(next);
        }
      }}
    >
      {enabled ? "On" : "Off"}
    </button>
  );
}

type ActionButtonsProps = {
  subject: string;
  actions: Array<{ label: string; value: string }>;
  onAction?: (value: string) => void | Promise<void>;
  disabled?: boolean;
};

export function ConfirmActions({ subject, actions, onAction, disabled = false }: ActionButtonsProps) {
  return (
    <div className="button-row">
      {actions.map((action) => (
        <button
          key={action.value}
          className="admin-button secondary"
          type="button"
          disabled={disabled}
          onClick={() => {
            const ok = window.confirm(`Apply ${action.label} to ${subject}?`);
            if (ok) {
              void onAction?.(action.value);
            }
          }}
          aria-label={`${action.label} ${subject}`}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
