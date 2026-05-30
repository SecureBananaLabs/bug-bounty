"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type AdminActionButtonProps = {
  apiBaseUrl: string;
  token: string;
  endpoint: string;
  method?: "PATCH" | "POST";
  body: Record<string, unknown>;
  label: string;
  tone?: "neutral" | "warning" | "danger";
};

export function AdminActionButton({
  apiBaseUrl,
  token,
  endpoint,
  method = "PATCH",
  body,
  label,
  tone = "neutral"
}: AdminActionButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const toneClass = {
    neutral: "secondary",
    warning: "warning",
    danger: "danger"
  }[tone];

  const runAction = () => {
    setError("");

    startTransition(async () => {
      try {
        const response = await fetch(`${apiBaseUrl}${endpoint}`, {
          method,
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(body)
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message ?? "Action failed");
        }

        router.refresh();
      } catch (error) {
        setError(error instanceof Error ? error.message : "Action failed");
      }
    });
  };

  return (
    <div style={{ display: "grid", gap: 4 }}>
      <button className={toneClass} type="button" onClick={runAction} disabled={pending}>
        {pending ? "Working..." : label}
      </button>
      {error ? <span className="admin-inline-error">{error}</span> : null}
    </div>
  );
}
