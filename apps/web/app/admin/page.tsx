"use client";

import { useState } from "react";
import { OverviewTab } from "./components/OverviewTab";
import { UsersTab } from "./components/UsersTab";
import { JobsTab } from "./components/JobsTab";
import { DisputesTab } from "./components/DisputesTab";
import { ControlsTab } from "./components/ControlsTab";
import { AuditLogTab } from "./components/AuditLogTab";

const TABS = ["Overview", "Users", "Jobs", "Disputes", "Controls", "Audit Log"] as const;
type Tab = (typeof TABS)[number];

export default function AdminPanelPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  return (
    <section>
      <h2>Admin Panel</h2>
      <nav
        style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}
        aria-label="Admin tabs"
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="card"
            style={{
              padding: "0.5rem 1rem",
              cursor: "pointer",
              fontWeight: activeTab === tab ? 700 : 400,
              borderBottom: activeTab === tab ? "2px solid #0070f3" : "2px solid transparent"
            }}
            aria-current={activeTab === tab ? "page" : undefined}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === "Overview" && <OverviewTab />}
      {activeTab === "Users" && <UsersTab />}
      {activeTab === "Jobs" && <JobsTab />}
      {activeTab === "Disputes" && <DisputesTab />}
      {activeTab === "Controls" && <ControlsTab />}
      {activeTab === "Audit Log" && <AuditLogTab />}
    </section>
  );
}
