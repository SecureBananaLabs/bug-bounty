import { shortDate } from "../format";
import type { Control } from "../types";

type ControlsSectionProps = {
  controls: Record<string, Control>;
  busyAction: string;
  onToggle: (key: string, enabled: boolean) => void;
};

export function ControlsSection({ controls, busyAction, onToggle }: ControlsSectionProps) {
  return (
    <section className="admin-section" aria-labelledby="controls-title">
      <h3 id="controls-title">Platform Controls</h3>
      <div className="controls-list">
        {Object.values(controls).map((control) => (
          <label className="toggle-row" key={control.key}>
            <span>
              <strong>{control.label}</strong>
              <em>{control.description}</em>
              <small>
                Updated by {control.updatedBy} at {shortDate(control.updatedAt)}
              </small>
            </span>
            <input
              type="checkbox"
              checked={control.enabled}
              disabled={busyAction !== ""}
              onChange={() => onToggle(control.key, !control.enabled)}
              aria-label={`Toggle ${control.label}`}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
