export default function PostJobPage() {
  return (
    <section className="card">
      <h2>Post a Job</h2>
      <form>
        <div>
          <label htmlFor="title">Job Title</label>
          <input id="title" type="text" placeholder="e.g. Build a React Dashboard" required minLength={4} />
        </div>
        <div>
          <label htmlFor="description">Description</label>
          <textarea id="description" placeholder="Describe the project, deliverables, and requirements" required minLength={10} rows={5} />
        </div>
        <div>
          <label htmlFor="budgetMin">Min Budget ($)</label>
          <input id="budgetMin" type="number" min={0} placeholder="500" />
        </div>
        <div>
          <label htmlFor="budgetMax">Max Budget ($)</label>
          <input id="budgetMax" type="number" min={0} placeholder="1500" />
        </div>
        <div>
          <label htmlFor="category">Category</label>
          <select id="category">
            <option value="web">Web Development</option>
            <option value="mobile">Mobile Development</option>
            <option value="design">Design</option>
            <option value="data">Data Science</option>
          </select>
        </div>
        <button type="submit">Post Job</button>
      </form>
    </section>
  );
}
