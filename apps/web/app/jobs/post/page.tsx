export default function PostJobPage() {
  return (
    <section>
      <div className="page-heading">
        <h2>Post a Job</h2>
        <p>Draft a clear project brief before inviting freelancers.</p>
      </div>

      <form className="card job-form">
        <div className="form-grid">
          <label className="field field-wide">
            <span>Project title</span>
            <input name="title" type="text" defaultValue="Build an AI customer support widget" />
          </label>

          <label className="field">
            <span>Category</span>
            <select name="category" defaultValue="engineering">
              <option value="engineering">Engineering</option>
              <option value="design">Design</option>
              <option value="automation">Automation</option>
              <option value="data">Data</option>
            </select>
          </label>

          <label className="field">
            <span>Budget range</span>
            <input name="budget" type="text" defaultValue="$1,500 - $2,000" />
          </label>

          <label className="field field-wide">
            <span>Required skills</span>
            <input name="skills" type="text" defaultValue="Next.js, TypeScript, AI integrations" />
          </label>

          <label className="field field-wide">
            <span>Project brief</span>
            <textarea
              name="description"
              rows={6}
              defaultValue="We need a lightweight support widget that can answer common product questions, collect contact details, and hand off unresolved conversations to the client dashboard."
            />
          </label>
        </div>

        <div className="job-form-summary">
          <div>
            <strong>Draft status</strong>
            <p>Ready for review once timeline and attachments are confirmed.</p>
          </div>
          <div className="actions">
            <button type="button">Save draft</button>
            <button type="button" className="primary-action">Preview post</button>
          </div>
        </div>
      </form>
    </section>
  );
}
