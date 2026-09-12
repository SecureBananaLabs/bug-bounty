export default function PostJobPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h2>Post a Job</h2>
      <section className="card">
        <form style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.25rem" }}>Job Title *</label>
            <input type="text" placeholder="e.g. Build a React dashboard" style={{ width: "100%", padding: "0.5rem", border: "1px solid #ddd", borderRadius: "6px" }} minLength={4} required />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.25rem" }}>Description *</label>
            <textarea placeholder="Describe the project, deliverables, and timeline..." style={{ width: "100%", padding: "0.5rem", border: "1px solid #ddd", borderRadius: "6px", minHeight: "120px" }} minLength={10} required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.25rem" }}>Min Budget ($) *</label>
              <input type="number" placeholder="100" min={0} style={{ width: "100%", padding: "0.5rem", border: "1px solid #ddd", borderRadius: "6px" }} required />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.25rem" }}>Max Budget ($) *</label>
              <input type="number" placeholder="1000" min={0} style={{ width: "100%", padding: "0.5rem", border: "1px solid #ddd", borderRadius: "6px" }} required />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.25rem" }}>Category *</label>
            <select style={{ width: "100%", padding: "0.5rem", border: "1px solid #ddd", borderRadius: "6px" }} required>
              <option value="">Select a category</option>
              <option value="engineering">Engineering</option>
              <option value="design">Design</option>
              <option value="writing">Writing</option>
              <option value="marketing">Marketing</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.25rem" }}>Required Skills</label>
            <input type="text" placeholder="e.g. React, Node.js, TypeScript (comma-separated)" style={{ width: "100%", padding: "0.5rem", border: "1px solid #ddd", borderRadius: "6px" }} />
          </div>
          <button type="submit" style={{ padding: "0.75rem", background: "#5468ff", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Post Job</button>
        </form>
      </section>
    </div>
  );
}
