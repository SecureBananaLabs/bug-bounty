"use client";

import { FormEvent, useMemo, useState } from "react";

type Draft = {
  title: string;
  category: string;
  budgetMin: string;
  budgetMax: string;
  skills: string;
  description: string;
};

const initialDraft: Draft = {
  title: "",
  category: "",
  budgetMin: "",
  budgetMax: "",
  skills: "",
  description: ""
};

export default function PostJobPage() {
  const [draft, setDraft] = useState(initialDraft);
  const [submitted, setSubmitted] = useState(false);

  const skills = useMemo(
    () =>
      draft.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    [draft.skills]
  );

  const errors = useMemo(() => {
    const nextErrors: Partial<Record<keyof Draft, string>> = {};
    if (!draft.title.trim()) nextErrors.title = "Add a project title.";
    if (!draft.category.trim()) nextErrors.category = "Choose a category.";
    if (!draft.budgetMin.trim()) nextErrors.budgetMin = "Add a minimum budget.";
    if (!draft.budgetMax.trim()) nextErrors.budgetMax = "Add a maximum budget.";
    if (!draft.description.trim()) nextErrors.description = "Describe the work.";

    const min = Number(draft.budgetMin);
    const max = Number(draft.budgetMax);
    if (draft.budgetMin && (!Number.isFinite(min) || min < 0)) {
      nextErrors.budgetMin = "Use a non-negative number.";
    }
    if (draft.budgetMax && (!Number.isFinite(max) || max < 0)) {
      nextErrors.budgetMax = "Use a non-negative number.";
    }
    if (Number.isFinite(min) && Number.isFinite(max) && min > max) {
      nextErrors.budgetMax = "Maximum budget must be at least the minimum.";
    }

    return nextErrors;
  }, [draft]);

  const isValid = Object.keys(errors).length === 0;

  function updateField(field: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="card">
      <h2>Post a Job</h2>
      <div className="grid">
        <form onSubmit={handleSubmit}>
          <label>
            Project title
            <input
              aria-invalid={submitted && Boolean(errors.title)}
              value={draft.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Build an AI customer support widget"
              style={inputStyle}
            />
          </label>
          {submitted && errors.title ? <p style={errorStyle}>{errors.title}</p> : null}

          <label>
            Category
            <select
              aria-invalid={submitted && Boolean(errors.category)}
              value={draft.category}
              onChange={(event) => updateField("category", event.target.value)}
              style={inputStyle}
            >
              <option value="">Select category</option>
              <option value="Development">Development</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Operations">Operations</option>
            </select>
          </label>
          {submitted && errors.category ? <p style={errorStyle}>{errors.category}</p> : null}

          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
            <label>
              Min budget
              <input
                aria-invalid={submitted && Boolean(errors.budgetMin)}
                value={draft.budgetMin}
                onChange={(event) => updateField("budgetMin", event.target.value)}
                placeholder="500"
                style={inputStyle}
              />
            </label>
            <label>
              Max budget
              <input
                aria-invalid={submitted && Boolean(errors.budgetMax)}
                value={draft.budgetMax}
                onChange={(event) => updateField("budgetMax", event.target.value)}
                placeholder="2500"
                style={inputStyle}
              />
            </label>
          </div>
          {submitted && errors.budgetMin ? <p style={errorStyle}>{errors.budgetMin}</p> : null}
          {submitted && errors.budgetMax ? <p style={errorStyle}>{errors.budgetMax}</p> : null}

          <label>
            Skills
            <input
              value={draft.skills}
              onChange={(event) => updateField("skills", event.target.value)}
              placeholder="Next.js, TypeScript, API design"
              style={inputStyle}
            />
          </label>

          <label>
            Description
            <textarea
              aria-invalid={submitted && Boolean(errors.description)}
              value={draft.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Describe deliverables, timeline, and review expectations."
              rows={6}
              style={inputStyle}
            />
          </label>
          {submitted && errors.description ? <p style={errorStyle}>{errors.description}</p> : null}

          <button type="submit" style={buttonStyle}>
            Save draft
          </button>
          {submitted && isValid ? <p style={successStyle}>Draft ready for review.</p> : null}
        </form>

        <aside className="card" style={{ marginBottom: 0 }}>
          <h3>Draft preview</h3>
          <p>
            <strong>{draft.title || "Untitled project"}</strong>
          </p>
          <p>{draft.category || "No category selected"}</p>
          <p>
            Budget: {draft.budgetMin || "-"} to {draft.budgetMax || "-"}
          </p>
          <p>Skills: {skills.length ? skills.join(", ") : "No skills added"}</p>
          <p>{draft.description || "No description yet."}</p>
        </aside>
      </div>
    </section>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  margin: "0.35rem 0 0.85rem",
  padding: "0.7rem",
  borderRadius: 8,
  border: "1px solid #2a3765",
  background: "#0f162d",
  color: "#f2f5ff"
};

const buttonStyle = {
  padding: "0.75rem 1rem",
  borderRadius: 8,
  border: "1px solid #6b7cff",
  background: "#4358d8",
  color: "#fff"
};

const errorStyle = {
  marginTop: "-0.5rem",
  color: "#ffb4b4"
};

const successStyle = {
  color: "#9ee6a8"
};
