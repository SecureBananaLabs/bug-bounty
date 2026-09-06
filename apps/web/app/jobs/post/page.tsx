"use client";
import { useState } from "react";

export default function PostJobPage() {
  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [category, setCategory] = useState("web-dev");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <section className="card">
        <h2>Job Posted!</h2>
        <p><strong>{title}</strong> has been submitted successfully.</p>
        <button onClick={() => setSubmitted(false)}>Post another</button>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Post a Job</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 480 }}>
        <label>
          Title
          <input required value={title} onChange={e => setTitle(e.target.value)} style={{ display: "block", width: "100%", marginTop: 4 }} />
        </label>
        <label>
          Budget
          <input placeholder="e.g. $1,500" value={budget} onChange={e => setBudget(e.target.value)} style={{ display: "block", width: "100%", marginTop: 4 }} />
        </label>
        <label>
          Category
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ display: "block", width: "100%", marginTop: 4 }}>
            <option value="web-dev">Web Development</option>
            <option value="design">Design</option>
            <option value="mobile">Mobile</option>
            <option value="data">Data / AI</option>
          </select>
        </label>
        <label>
          Description
          <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ display: "block", width: "100%", marginTop: 4 }} />
        </label>
        <button type="submit">Post Job</button>
      </form>
    </section>
  );
}
