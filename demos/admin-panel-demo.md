# Admin Panel — Demo Walkthrough

## Dashboard
- 8 live metrics cards: Total Users, Active Freelancers, Open Jobs, Active Jobs, Monthly Volume, Flagged Accounts, Pending Disputes, New Today
- Real data aggregated from userService, jobService, reviewService, notificationService
- Manual refresh button available

## User Management
- Sortable table with all users (name, email, role, status)
- Real API data with server-side pagination (20 per page)
- Filters: search by name/email/ID, filter by role, filter by status
- Detail panel with full user info and admin actions (Suspend, Reinstate, Ban)
- Confirmation dialogs for destructive actions

## Job Management
- Jobs table with title, posted by, budget, status, proposals
- Real API data with server-side pagination
- Filters: search, status filter, flagged-only toggle
- Detail panel with moderation actions (Approve, Reject, Escalate)
- Rejected listings trigger notifications to the posting user

## Dispute Resolution
- Dispute queue with job title, reason, status, date
- Filter by status (open, under_review, resolved, escalated)
- Threaded notes system
- 3 ruling options: Rule for Freelancer, Client, Split
- Escalate to senior admin

## Audit Log
- Append-only audit log of all admin actions
- Timestamp, action type, admin ID, detailed payload
- Paginated with total count

## Platform Controls
- Toggle: Enable/Disable User Registrations
- Toggle: Enable/Disable Job Postings
- Confirmation dialog before each toggle
- All toggles logged to audit trail

## Security
- Dual auth guard: authMiddleware + adminOnly on every endpoint
- Server-side role enforcement on every API call
