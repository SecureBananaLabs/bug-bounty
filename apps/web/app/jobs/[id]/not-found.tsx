import Link from "next/link";

export default function JobNotFound() {
  return (
    <section className="card">
      <p style={{ marginTop: 0, opacity: 0.75 }}>Job not found</p>
      <h2>That listing does not exist.</h2>
      <p>The requested job id is not present in the current mock dataset.</p>
      <Link href="/jobs">Return to jobs</Link>
    </section>
  );
}
