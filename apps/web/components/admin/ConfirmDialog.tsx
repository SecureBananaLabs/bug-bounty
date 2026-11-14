"use client";
import { useState } from "react";

/**
 * Confirmation dialog that requires explicit confirmation before applying
 * a destructive action. Modal is fully keyboard-accessible.
 */
export function ConfirmDialog({
  children,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
}: {
  children: React.ReactNode;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
    setOpen(false);
  };

  return (
    <>
      <span onClick={() => setOpen(true)} style={{ cursor: "pointer" }}>
        {children}
      </span>

      {open && (
        <div
          className="confirm-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-message"
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        >
          <div className="confirm-dialog card" role="alertdialog">
            <h3 id="confirm-title">{title}</h3>
            <p id="confirm-message">{message}</p>
            <div className="confirm-actions">
              <button onClick={() => setOpen(false)} disabled={submitting} aria-label={cancelLabel}>
                {cancelLabel}
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                aria-label={confirmLabel}
                style={{ background: "#c53030", color: "#fff" }}
              >
                {submitting ? "Applying…" : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
