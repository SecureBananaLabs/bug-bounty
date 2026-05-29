"use client";

import { FormEvent, useMemo, useState } from "react";

const categories = ["Engineering", "Design", "Writing", "Growth"];

const fieldStyle = {
  width: "100%",
  marginTop: 6,
  border: "1px solid #354577",
  borderRadius: 8,
  background: "#0f162b",
  color: "#f2f5ff",
  padding: "0.7rem 0.8rem"
};

export default function PostJobPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [skills, setSkills] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const skillList = useMemo(
    () =>
      skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    [skills]
  );

  const errors = useMemo(() => {
    const nextErrors: string[] = [];
    const min = Number(budgetMin);
    const max = Number(budgetMax);

    if (title.trim().length < 4) {
      nextErrors.push("Title must be at least 4 characters.");
    }
    if (!budgetMin || Number.isNaN(min) || min < 0) {
      nextErrors.push("Minimum budget must be a non-negative number.");
    }
    if (!budgetMax || Number.isNaN(max) || max < 0) {
      nextErrors.push("Maximum budget must be a non-negative number.");
    }
    if (budgetMin && budgetMax && !Number.isNaN(min) && !Number.isNaN(max) && min > max) {
      nextErrors.push("Minimum budget cannot exceed maximum budget.");
    }
    if (skillList.length === 0) {
      nextErrors.push("Add at least one skill.");
    }
    if (description.trim().length < 10) {
      nextErrors.push("Description must be at least 10 characters.");
    }

    return nextErrors;
  }, [budgetMax, budgetMin, description, skillList.length, title]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="card" style={{ display: "grid", gap: "1rem" }}>
      <h2>Post a Job</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem" }}>
        <label>
          Job title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Build a customer dashboard"
            style={fieldStyle}
          />
        </label>

        <label>
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value)} style={fieldStyle}>
            {categories.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>

        <div className="grid">
          <label>
            Minimum budget
            <input
              value={budgetMin}
              onChange={(event) => setBudgetMin(event.target.value)}
              min="0"
              inputMode="numeric"
              placeholder="500"
              type="number"
              style={fieldStyle}
            />
          </label>
          <label>
            Maximum budget
            <input
              value={budgetMax}
              onChange={(event) => setBudgetMax(event.target.value)}
              min="0"
              inputMode="numeric"
              placeholder="1500"
              type="number"
              style={fieldStyle}
            />
          </label>
        </div>

        <label>
          Skills
          <input
            value={skills}
            onChange={(event) => setSkills(event.target.value)}
            placeholder="Next.js, TypeScript, API design"
            style={fieldStyle}
          />
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the project outcome, constraints, and handoff expectations."
            rows={5}
            style={{ ...fieldStyle, resize: "vertical" }}
          />
        </label>

        {submitted && errors.length > 0 ? (
          <div style={{ border: "1px solid #c2410c", borderRadius: 8, padding: "1rem" }}>
            <strong>Draft needs attention</strong>
            <ul>
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {submitted && errors.length === 0 ? (
          <div style={{ border: "1px solid #22c55e", borderRadius: 8, padding: "1rem" }}>
            <strong>Draft ready for review</strong>
            <p style={{ marginBottom: 0 }}>The job details below are complete enough to hand off to persistence.</p>
          </div>
        ) : null}

        <button
          type="submit"
          style={{
            justifySelf: "start",
            border: "1px solid #4f63a6",
            borderRadius: 8,
            background: "#f2f5ff",
            color: "#0b1020",
            cursor: "pointer",
            fontWeight: 700,
            padding: "0.7rem 1rem"
          }}
        >
          Save Draft
        </button>
      </form>

      <aside style={{ background: "#10182e", border: "1px solid #2a3765", borderRadius: 8, padding: "1rem" }}>
        <h3 style={{ marginTop: 0 }}>Draft preview</h3>
        <p>
          <strong>{title.trim() || "Untitled job"}</strong>
        </p>
        <p>Category: {category}</p>
        <p>
          Budget: {budgetMin || "0"} - {budgetMax || "0"}
        </p>
        <p>Skills: {skillList.length > 0 ? skillList.join(", ") : "None added"}</p>
        <p style={{ marginBottom: 0 }}>{description.trim() || "No description added yet."}</p>
      </aside>
    </section>
  );
}
