export default function PostJobPage() {
  return (
    <section>
      <h2>Post a Job</h2>
      <form
        action="/api/jobs"
        className="card"
        method="post"
        style={{ display: "grid", gap: 16 }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          Job title
          <input name="title" placeholder="Senior React dashboard build" required type="text" />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Project description
          <textarea
            name="description"
            placeholder="Describe the work, deliverables, and acceptance criteria."
            required
            rows={6}
          />
        </label>

        <div className="grid">
          <label style={{ display: "grid", gap: 6 }}>
            Minimum budget
            <input min="0" name="budgetMin" placeholder="500" required type="number" />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Maximum budget
            <input min="0" name="budgetMax" placeholder="1500" required type="number" />
          </label>
        </div>

        <div className="grid">
          <label style={{ display: "grid", gap: 6 }}>
            Category
            <select defaultValue="web-development" name="categoryId" required>
              <option value="web-development">Web development</option>
              <option value="mobile-apps">Mobile apps</option>
              <option value="design">Design</option>
              <option value="writing">Writing</option>
            </select>
          </label>

          <fieldset style={{ border: "1px solid #2a3765", margin: 0, padding: "0.75rem" }}>
            <legend>Required skills</legend>
            <label>
              <input name="skills" type="checkbox" value="React" /> React
            </label>
            <label style={{ marginLeft: 12 }}>
              <input name="skills" type="checkbox" value="Node.js" /> Node.js
            </label>
            <label style={{ marginLeft: 12 }}>
              <input name="skills" type="checkbox" value="UI Design" /> UI Design
            </label>
          </fieldset>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button type="submit">Publish job</button>
          <button type="button">Save draft</button>
        </div>
      </form>
      </section>
  );
}
