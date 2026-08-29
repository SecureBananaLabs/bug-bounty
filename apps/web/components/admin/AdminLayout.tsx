"use client";
import { useState } from "react";
import { MetricsSection } from "./sections/MetricsSection";
import { UsersSection } from "./sections/UsersSection";
import { JobsSection } from "./sections/JobsSection";
import { DisputesSection } from "./sections/DisputesSection";
import { ControlsSection } from "./sections/ControlsSection";
import { AuditLogSection } from "./sections/AuditLogSection";

const sections = [
  { id: "dashboard", label: "Dashboard", render: () => <MetricsSection /> },
  { id: "users", label: "Users", render: () => <UsersSection /> },
  { id: "jobs", label: "Job Moderation", render: () => <JobsSection /> },
  { id: "disputes", label: "Disputes", render: () => <DisputesSection /> },
  { id: "controls", label: "Platform Controls", render: () => <ControlsSection /> },
  { id: "audit", label: "Audit Log", render: () => <AuditLogSection /> },
] as const;

type SectionId = (typeof sections)[number]["id"];

/**
 * Modular admin layout. Each section is an independent component that can be
 * developed and tested in isolation. The nav is keyboard-navigable and persists
 * the active section in the URL hash so deep-linking / back-button works.
 */
export function AdminLayout() {
  const [active, setActive] = useState<SectionId>(initialSection());

  function initialSection(): SectionId {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.slice(1) as SectionId;
      if (sections.some((s) => s.id === hash)) return hash;
    }
    return "dashboard";
  }

  const navigate = (id: SectionId) => {
    setActive(id);
    if (typeof window !== "undefined") {
      window.location.hash = "#" + id;
    }
  };

  const current = sections.find((s) => s.id === active) ?? sections[0];

  return (
    <>
      <nav className="admin-nav" aria-label="Admin section navigation">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => navigate(s.id)}
            aria-current={s.id === active ? "page" : undefined}
            aria-label={`Navigate to ${s.label.toLowerCase()}`}
            type="button"
          >
            {s.label}
          </button>
        ))}
      </nav>

      <main id="admin-section" aria-live="polite">
        {current.render()}
      </main>
    </>
  );
}
