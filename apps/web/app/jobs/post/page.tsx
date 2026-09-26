"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

const categories = ["Engineering", "Design", "Writing", "Growth"];

export default function PostJobPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [skills, setSkills] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => {
    const nextErrors: string[] = [];
    const min = Number(budgetMin);
    const max = Number(budgetMax);

    if (!title.trim()) nextErrors.push("Add a project title.");
    if (!description.trim()) nextErrors.push("Add a project description.");
    if (!budgetMin || Number.isNaN(min) || min < 0) nextErrors.push("Enter a valid minimum budget.");
    if (!budgetMax || Number.isNaN(max) || max < 0) nextErrors.push("Enter a valid maximum budget.");
    if (budgetMin && budgetMax && min > max) nextErrors.push("Minimum budget must be below maximum budget.");

    return nextErrors;
  }, [budgetMax, budgetMin, description, title]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  const skillList = skills
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

  return (
    <section className="grid post-job-layout">
      <form className="card stack" onSubmit={handleSubmit}>
        <div>
          <h2>Post a Job</h2>
          <p>Draft the key details clients need before publishing a project.</p>
        </div>

        <label className="post-job-field">
          Project title
          <input
            className="post-job-control"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Build an AI customer support widget"
          />
        </label>

        <label className="post-job-field">
          Category
          <select
            className="post-job-control"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>

        <div className="post-job-row">
          <label className="post-job-field">
            Minimum budget
            <input
              className="post-job-control"
              min="0"
              type="number"
              value={budgetMin}
              onChange={(event) => setBudgetMin(event.target.value)}
              placeholder="500"
            />
          </label>
          <label className="post-job-field">
            Maximum budget
            <input
              className="post-job-control"
              min="0"
              type="number"
              value={budgetMax}
              onChange={(event) => setBudgetMax(event.target.value)}
              placeholder="1500"
            />
          </label>
        </div>

        <label className="post-job-field">
          Skills
          <input
            className="post-job-control"
            value={skills}
            onChange={(event) => setSkills(event.target.value)}
            placeholder="React, Node.js, analytics"
          />
        </label>

        <label className="post-job-field">
          Description
          <textarea
            className="post-job-control"
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the project scope, outcomes, and timeline."
          />
        </label>

        {submitted && errors.length > 0 ? (
          <div className="notice" role="alert">
            <strong>Resolve before publishing</strong>
            <ul>
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {submitted && errors.length === 0 ? (
          <p className="notice" role="status">Draft is ready for API persistence.</p>
        ) : null}

        <button className="post-job-action" type="submit">Review Draft</button>
      </form>

      <aside className="card stack" aria-label="Job draft preview">
        <h2>Draft Preview</h2>
        <div>
          <h3>{title.trim() || "Untitled project"}</h3>
          <p>{category}</p>
          <p>
            {budgetMin || "0"} - {budgetMax || "0"} USD
          </p>
        </div>
        <p>{description.trim() || "Project description will appear here."}</p>
        <div className="skill-list">
          {skillList.length > 0 ? (
            skillList.map((skill) => <span key={skill}>{skill}</span>)
          ) : (
            <span>No skills added</span>
          )}
        </div>
      </aside>
    </section>
  );
}
