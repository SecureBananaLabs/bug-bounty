**Bounty Description – Resolve Mock Job Lookup on `/jobs/[id]` Route**

---

### Overview  

The current implementation of the job‑detail page (`/jobs/[id]`) in the **apps/web** project displays a static placeholder string that simply echoes the route parameter. While the job list correctly links to concrete mock identifiers such as `job-101`, `job-102`, and `job-103`, the detail view fails to retrieve the corresponding mock data from `apps/web/lib/mock.ts`. Consequently, users see generic copy instead of the expected title, description, budget, and other contextual fields. Moreover, the page treats unknown identifiers as valid, showing the same placeholder UI rather than a clear “not found” message.  

This bounty seeks a focused, high‑quality fix that restores proper mock‑data resolution for known IDs and introduces an explicit fallback for unknown IDs, without altering unrelated parts of the codebase.

---

### Expected Behaviour  

1. **Accurate Data Rendering**  
   - When a user navigates to `/jobs/job-101`, the page must query `mock.jobs` (or the appropriate exported structure) and render the exact title, budget, and any additional fields defined for that mock entry.  
   - The same applies to all other known identifiers (`job-102`, `job-103`, etc.).  

2. **Clear Not‑Found Handling**  
   - If the URL contains an ID that does not exist in the mock dataset, the UI should present a concise “Job not found” message or a dedicated 404 component.  
   - The fallback must be visually distinct from the regular job‑detail layout, preventing users from assuming a valid job is being displayed.  

3. **Consistent UX**  
   - Maintain the existing styling, layout, and navigation patterns of the detail page.  
   - Ensure that loading states, error boundaries, and SEO meta tags continue to function as before.  

4. **Minimal Scope**  
   - Changes should be confined to the job‑detail route (`pages/jobs/[id].tsx` or equivalent) and, if necessary, the mock data shape in `apps/web/lib/mock.ts`.  
   - No modifications to the job‑list page, global routing, or unrelated components are required.  

---

### Technical Guidance  

1. **Import the Mock Store**  
   ```ts
   import { mockJobs } from '@/lib/mock';
   ```  
   Ensure the mock file exports a predictable structure, e.g., `Record<string, Job>` or an array that can be indexed by ID.  

2. **Lookup Logic**  
   - Extract the `id` parameter via `useRouter()` or `getServerSideProps` depending on the rendering strategy.  
   - Perform a simple lookup: `const job = mockJobs[id];`.  
   - Guard against `undefined` to trigger the not‑found UI.  

3. **Conditional Rendering**  
   ```tsx
   if (!job) {
     return <NotFoundMessage />;
   }
   return (
     <JobDetail
       title={job.title}
       budget={job.budget}
       description={job.description}
       // …other props
     />
   );
   ```  

4. **Fallback Component**  
   Create a lightweight component that mirrors the site’s design language:  
   ```tsx
   const NotFoundMessage = () => (
     <section className="flex flex-col items-center py-12">
       <h2 className="text-2xl font-semibold">Job not found</h2>
       <p className="mt-2 text-gray-600">
         The job you are looking for does not exist or may have been removed.
       </p>
       <Link href="/jobs">
         <a className="mt-4 text-primary underline">Return to job listings</a>
       </Link>
     </section>
   );
   ```  

5. **Testing**  
   - Verify that each known mock ID renders the correct data.  
   - Test a random, non‑existent ID (e.g., `job-999`) and confirm the not‑found UI appears.  
   - Run the existing unit and integration tests to ensure no regressions.  

---

### Acceptance Criteria  

- **Data Accuracy** – All known mock IDs display their exact title, budget, and supplementary fields.  
- **Error Handling** – Unknown IDs render a distinct “Job not found” view; no placeholder text is shown.  
- **Code Quality** – The new logic follows the project’s TypeScript conventions, includes appropriate type guards, and does not introduce linting warnings.  
- **Documentation** – Update any inline comments or README sections that reference the job‑detail route to reflect the new behaviour.  

---

### Why This Matters  

Providing a realistic job‑detail experience is essential for both internal testing and stakeholder demos. Accurate mock data ensures that UI components, analytics events, and content strategies are evaluated against realistic scenarios. Moreover, a clear not‑found fallback prevents confusion, improves perceived reliability, and aligns the application with standard web‑accessibility practices.  

By completing this bounty, you will close a functional gap that currently undermines the fidelity of the job marketplace prototype and elevate the overall quality of the web application.  

---  

**Ready to deliver?** Submit a pull request that satisfies the criteria above, and the bounty will be awarded upon successful review. Thank you for your contribution!