**Feature Overview**

The freelancer profile route (`/freelancers/[username]`) is intended to display a detailed mock profile for a given username. Currently the page falls back to static placeholder text, showing only the raw username and ignoring the mock data defined in `apps/web/lib/mock.ts`. This results in:

* Search result cards linking to `/freelancers/maya-dev` and `/freelancers/jordan-ux` that do not render the corresponding skill sets, hourly rates, or bio.
* Any arbitrary string entered after `/freelancers/` being treated as a valid profile, producing a generic “profile not found” message that isn’t helpful.
* A mismatch between the UI expectations (rich profile information) and the underlying data source (the mock data set).

The bounty calls for a concise fix that restores the intended behavior while keeping the change scoped to the web side of the application.

---

### Desired Behavior

1. **Lookup by Username** – When the route receives a known username (e.g., `maya-dev`, `jordan-ux`), it should locate the matching entry in `mock.ts` and render that profile’s fields: name, title, hourly rate, skill tags, bio, and any other mock attributes.
2. **Graceful Fallback** – If the username does not exist in the mock data, the page should render a clear “Freelancer not found” view, optionally offering a link back to the search or home page.
3. **Consistent UI** – The profile page should use the same component layout as other parts of the site (skill chips, rate badge, avatar, etc.), ensuring a uniform experience across the product.
4. **Zero Side‑Effects** – The fix must not alter the mock data shape unless a minimal, non‑breaking addition is required for the profile component to render correctly.

---

### Implementation Plan

1. **Import Mock Data**  
   In `apps/web/pages/freelancers/[username].tsx` (or the equivalent route component), import the mock collection:
   ```ts
   import { freelancers } from '@/lib/mock';
   ```
   Ensure the import path matches the current project alias configuration.

2. **Extract Username Parameter**  
   Use Next.js router utilities to read the dynamic segment:
   ```ts
   const router = useRouter();
   const { username } = router.query as { username: string };
   ```

3. **Find Matching Profile**  
   Perform a simple lookup:
   ```ts
   const profile = useMemo(() => freelancers.find(f => f.username === username), [username]);
   ```
   *If the mock data does not already contain a `username` field, add it as a required property in the mock objects (e.g., `username: 'maya-dev'`). This is the only permissible shape adjustment.*

4. **Conditional Rendering**  
   ```tsx
   if (!profile) {
     return (
       <NotFoundPage
         message={`No freelancer found for “${username}”.`}
         backLink="/search"
       />
     );
   }

   return (
     <FreelancerProfile
       name={profile.name}
       title={profile.title}
       rate={profile.hourlyRate}
       skills={profile.skills}
       bio={profile.bio}
       avatar={profile.avatar}
     />
   );
   ```
   Reuse existing UI components (`FreelancerProfile`, `SkillChip`, `RateBadge`) to avoid duplication.

5. **Add Type Safety**  
   Extend the mock type definition (if needed) to include `username: string`. This ensures TypeScript catches mismatches early and clarifies the contract between the data source and the route.

6. **Testing**  
   * **Unit Test** – Mock the router and verify that a known username renders the correct name, rate, and skill list.  
   * **Integration Test** – Navigate to `/freelancers/maya-dev` and assert the presence of “Maya”’s skill chips and `$70/hr` badge.  
   * **Negative Test** – Visit `/freelancers/unknown-user` and confirm the not‑found component appears with the expected fallback message.

7. **Documentation Update**  
   Add a short comment in the route file describing the lookup logic and the expected shape of `freelancers` entries, helping future contributors understand why the username field is required.

---

### Minimal Mock Data Adjustment

If the current mock entries lack a unique identifier, introduce a `username` key:

```ts
export const freelancers = [
  {
    username: 'maya-dev',
    name: 'Maya Patel',
    title: 'Full‑Stack Developer',
    hourlyRate: 70,
    skills: ['React', 'Node.js', 'GraphQL'],
    bio: 'Passionate about building scalable web apps...',
    avatar: '/avatars/maya.png',
  },
  {
    username: 'jordan-ux',
    name: 'Jordan Lee',
    title: 'UX Designer',
    hourlyRate: 55,
    skills: ['Figma', 'User Research', 'Prototyping'],
    bio: 'Designing intuitive experiences for SaaS products...',
    avatar: '/avatars/jordan.png',
  },
];
```

Only two fields (`username` and `avatar`) are added; the rest of the mock data remains untouched.

---

### Expected Outcome

* Visiting `/freelancers/maya-dev` now displays Maya’s full mock profile, complete with skill chips, hourly rate, and bio.
* Visiting `/freelancers/jordan-ux` similarly renders Jordan’s details.
* Navigating to any unknown username (e.g., `/freelancers/foobar`) shows a concise “Freelancer not found” page with a link back to search, preventing the previous ambiguous placeholder view.
* The codebase remains clean, with the fix isolated to the profile route and a tiny, well‑documented change to the mock data shape.

By implementing this focused lookup, the web application regains its intended functionality, improves user experience, and satisfies the bounty requirements without introducing unnecessary complexity.