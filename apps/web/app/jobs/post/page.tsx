"use client";

export default function PostJobPage() {
  return (
    <section className="card">
      <h2>Post a Job</h2>
      <form>
        <div>
          <label htmlFor="title">Title</label>
          <input id="title" name="title" type="text" placeholder="e.g. Build a REST API" required />
        </div>
        <div>
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" placeholder="Describe the project scope, deliverables, and timeline" required />
        </div>
        <div>
          <label htmlFor="budgetMin">Budget Min ($)</label>
          <input id="budgetMin" name="budgetMin" type="number" min="0" placeholder="500" required />
        </div>
        <div>
          <label htmlFor="budgetMax">Budget Max ($)</label>
          <input id="budgetMax" name="budgetMax" type="number" min="0" placeholder="2000" required />
        </div>
        <div>
          <label htmlFor="category">Category</label>
          <input id="category" name="category" type="text" placeholder="e.g. Backend Development" required />
        </div>
        <div>
          <label htmlFor="skills">Skills (comma-separated)</label>
          <input id="skills" name="skills" type="text" placeholder="e.g. Node.js, TypeScript, PostgreSQL" />
        </div>
        <button type="submit">Post Job</button>
      </form>
    </section>
  );
}
