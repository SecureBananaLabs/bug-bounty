"use client";
import { useState } from "react";

const CATEGORIES = ["Web Development", "Mobile", "Design", "Data Science", "DevOps", "Writing", "Marketing"];
const SKILL_OPTIONS = ["React", "Node.js", "TypeScript", "Python", "Figma", "AWS", "PostgreSQL", "GraphQL"];

export default function PostJobPage() {
  const [title, setTitle]       = useState("");
  const [description, setDesc]  = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [category, setCategory] = useState("");
  const [skills, setSkills]     = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]       = useState("");

  const toggleSkill = (s: string) =>
    setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !budgetMin || !budgetMax || !category) {
      setError("Please fill in all required fields."); return;
    }
    if (Number(budgetMin) > Number(budgetMax)) {
      setError("Budget minimum cannot exceed maximum."); return;
    }
    setError("");
    setSubmitted(true);
  };

  if (submitted) return (
    <section className="card" style={{ padding: "2rem", textAlign: "center" }}>
      <h2>✅ Job Posted!</h2>
      <p>Your listing for <strong>{title}</strong> has been submitted for review.</p>
      <button onClick={() => setSubmitted(false)} style={{ cursor: "pointer", marginTop: "1rem" }}>Post Another Job</button>
    </section>
  );

  return (
    <main style={{ padding: "1.5rem", maxWidth: 700, margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>Post a Job</h1>
      {error && <p style={{ color: "red", background: "#fee", padding: "0.5rem", borderRadius: 6 }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <label>Title *<input required value={title} onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Build a React dashboard" style={{ display: "block", width: "100%", marginTop: "0.25rem" }} /></label>

        <label>Description *<textarea required value={description} onChange={e => setDesc(e.target.value)}
          placeholder="Describe the project in detail…" rows={5}
          style={{ display: "block", width: "100%", marginTop: "0.25rem" }} /></label>

        <fieldset style={{ border: "1px solid #ddd", borderRadius: 6, padding: "0.75rem" }}>
          <legend>Budget (USD) *</legend>
          <div style={{ display: "flex", gap: "1rem" }}>
            <label style={{ flex: 1 }}>Min
              <input type="number" min="1" required value={budgetMin} onChange={e => setBudgetMin(e.target.value)}
                placeholder="500" style={{ display: "block", width: "100%", marginTop: "0.25rem" }} />
            </label>
            <label style={{ flex: 1 }}>Max
              <input type="number" min="1" required value={budgetMax} onChange={e => setBudgetMax(e.target.value)}
                placeholder="2000" style={{ display: "block", width: "100%", marginTop: "0.25rem" }} />
            </label>
          </div>
        </fieldset>

        <label>Category *
          <select required value={category} onChange={e => setCategory(e.target.value)}
            style={{ display: "block", width: "100%", marginTop: "0.25rem" }}>
            <option value="">Select a category…</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <fieldset style={{ border: "1px solid #ddd", borderRadius: 6, padding: "0.75rem" }}>
          <legend>Required Skills</legend>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
            {SKILL_OPTIONS.map(s => (
              <button type="button" key={s} onClick={() => toggleSkill(s)}
                aria-pressed={skills.includes(s)}
                style={{ cursor: "pointer", padding: "0.3rem 0.7rem", borderRadius: 99,
                  background: skills.includes(s) ? "#5468ff" : "#f0f0f0",
                  color: skills.includes(s) ? "#fff" : "#333", border: "none" }}>
                {s}
              </button>
            ))}
          </div>
        </fieldset>

        <button type="submit" style={{ cursor: "pointer", padding: "0.75rem", background: "#5468ff", color: "#fff", border: "none", borderRadius: 8, fontSize: "1rem" }}>
          Post Job
        </button>
      </form>
    </main>
  );
}
