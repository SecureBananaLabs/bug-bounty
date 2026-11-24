import React from 'react';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]'; // Path to your NextAuth options. Adjust if your file structure is different (e.g., '../../api/auth/[...nextauth]')

// --- Interface for user session, augmented for roles and ID as expected by the panel ---
// This interface assumes that your NextAuth.js configuration (via callbacks)
// enriches the session object to include 'id' and 'role' in `session.user`.
interface UserSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user' | 'moderator'; // Define roles as per your platform's requirements
  };
  expires: string; // ISO date string representing session expiration
  // Add any other relevant session-related properties here (e.g., accessToken)
}

// --- Props for the AdminPanelPage component ---
interface AdminPanelProps {
  session: UserSession; // Session is guaranteed to be present and admin by getServerSideProps
  // Any initial data for the admin panel overview could be passed here,
  // fetched server-side for performance.
  // e.g., dashboardStats: { totalUsers: number, activeJobs: number, pendingDisputes: number }
}

const AdminPanelPage: NextPage<AdminPanelProps> = ({ session }) => {
  const router = useRouter();

  // This client-side check serves as a defensive fallback or for cases where
  // a session might become invalid *after* the initial page load (e.g., session expiration).
  // The primary access enforcement happens server-side in `getServerSideProps`.
  if (!session || session.user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-red-600">Access Denied: You must be an administrator to view this page.</p>
      </div>
    );
  }

  // Define the sections for the modular admin panel layout.
  const sections = [
    { name: 'Users', path: 'users' },
    { name: 'Jobs', path: 'jobs' },
    { name: 'Disputes', path: 'disputes' },
    { name: 'Platform Health', path: 'health' },
    { name: 'Settings', path: 'settings' },
    { name: 'Audit Log', path: 'audit-log' }, // Added Audit Log as per acceptance criteria
  ];

  // Determine the current active section from the URL query parameter.
  // Defaults to 'users' if no section is specified.
  const currentSection = (router.query.section as string) || 'users';

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans antialiased">
      <Head>
        <title>Admin Panel - Freelance Platform</title>
        <meta name="description" content="Admin panel for managing freelance platform operations" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Sidebar Navigation */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col p-4 shadow-lg">
        <h2 className="text-3xl font-bold mb-8 text-indigo-400">Admin Dashboard</h2>
        <nav className="flex-1">
          <ul>
            {sections.map((section) => (
              <li key={section.path} className="mb-3">
                <a
                  onClick={() => router.push(`/admin?section=${section.path}`, undefined, { shallow: true })}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-200 cursor-pointer text-lg
                    ${currentSection === section.path
                      ? 'bg-indigo-600 text-white font-semibold shadow-md'
                      : 'hover:bg-gray-700 text-gray-300 hover:text-white'
                    }`}
                  aria-current={currentSection === section.path ? 'page' : undefined}
                >
                  {/* Icon placeholders - replace with actual icon components (e.g., from react-icons) */}
                  {section.path === 'users' && <UserIcon />}
                  {section.path === 'jobs' && <BriefcaseIcon />}
                  {section.path === 'disputes' && <ScaleIcon />}
                  {section.path === 'health' && <ChartBarIcon />}
                  {section.path === 'settings' && <CogIcon />}
                  {section.path === 'audit-log' && <ClipboardListIcon />}
                  {section.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        {/* Admin User Info and Logout */}
        <div className="mt-auto pt-6 border-t border-gray-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm uppercase">
            {session.user.name.charAt(0)}
          </div>
          <div>
            <p className="text-md text-gray-200">{session.user.name}</p>
            <p className="text-sm text-gray-400">{session.user.email}</p>
          </div>
          {/* A logout button can be added here, potentially linking to NextAuth.js signOut */}
          {/* <button className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
            Logout
          </button> */}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 pb-4 border-b border-gray-200 capitalize">
          {currentSection.toString().replace(/-/g, ' ')}
          <span className="ml-2 text-indigo-600">Overview</span>
        </h1>

        <div className="bg-white p-8 rounded-xl shadow-lg min-h-[calc(100vh-180px)]">
          {/* Conditional rendering of section content based on `currentSection` */}
          {currentSection === 'users' && (
            <div>
              <h2 className="text-3xl font-semibold mb-6 text-gray-800">User Management</h2>
              <p className="text-gray-700 leading-relaxed">
                Here, administrators can view a list of all users, their profiles, roles, activity logs, and
                perform actions such as suspending accounts, resetting passwords, or assigning special permissions.
              </p>
              <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200 min-h-[150px] flex items-center justify-center text-gray-400">
                <p>Content for User Management will be displayed here.</p>
                {/* UserManagementComponent will be imported and rendered here. */}
              </div>
            </div>
          )}
          {currentSection === 'jobs' && (
            <div>
              <h2 className="text-3xl font-semibold mb-6 text-gray-800">Job Listings Moderation</h2>
              <p className="text-gray-700 leading-relaxed">
                This section allows for the review and moderation of job postings. Admins can approve, reject,
                edit, or remove listings, ensuring quality and compliance with platform guidelines.
              </p>
              <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200 min-h-[150px] flex items-center justify-center text-gray-400">
                <p>Content for Job Listings Moderation will be displayed here.</p>
                {/* JobModerationComponent will be imported and rendered here. */}
              </div>
            </div>
          )}
          {currentSection === 'disputes' && (
            <div>
              <h2 className="text-3xl font-semibold mb-6 text-gray-800">Dispute Resolution Center</h2>
              <p className="text-gray-700 leading-relaxed">
                Manage all ongoing disputes between freelancers and clients. Review submitted evidence,
                communicate with parties, and make impartial decisions to resolve conflicts effectively.
              </p>
              <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200 min-h-[150px] flex items-center justify-center text-gray-400">
                <p>Content for Dispute Resolution will be displayed here.</p>
                {/* DisputeResolutionComponent will be imported and rendered here. */}
              </div>
            </div>
          )}
          {currentSection === 'health' && (
            <div>
              <h2 className="text-3xl font-semibold mb-6 text-gray-800">Platform Health & Metrics</h2>
              <p className="text-gray-700 leading-relaxed">
                Monitor key performance indicators (KPIs), user activity trends, system performance,
                and financial metrics to ensure the platform&apos;s overall health and growth.
              </p>
              <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200 min-h-[150px] flex items-center justify-center text-gray-400">
                <p>Content for Platform Health & Metrics will be displayed here.</p>
                {/* PlatformHealthComponent will be imported and rendered here. */}
              </div>
            </div>
          )}
          {currentSection === 'settings' && (
            <div>
              <h2 className="text-3xl font-semibold mb-6 text-gray-800">Platform Global Settings</h2>
              <p className="text-gray-700 leading-relaxed">
                Configure various global settings for the platform, including user permissions, email templates,
                fee structures, integrations, and other system-wide configurations.
              </p>
              <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200 min-h-[150px] flex items-center justify-center text-gray-400">
                <p>Content for Platform Global Settings will be displayed here.</p>
                {/* GlobalSettingsComponent will be imported and rendered here. */}
              </div>
            </div>
          )}
          {currentSection === 'audit-log' && (
            <div>
              <h2 className="text-3xl font-semibold mb-6 text-gray-800">Audit Log</h2>
              <p className="text-gray-700 leading-relaxed">
                View a detailed log of all administrative actions performed on the platform, filterable by admin,
                action type, and date range for compliance and accountability.
              </p>
              <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200 min-h-[150px] flex items-center justify-center text-gray-400">
                <p>Content for Audit Log will be displayed here.</p>
                {/* AuditLogComponent will be imported and rendered here. */}
              </div>
            </div>
          )}
          {/* Fallback for unknown sections or invalid URLs */}
          {!sections.some(s => s.path === currentSection) && (
            <div>
              <h2 className="text-3xl font-semibold mb-6 text-gray-800">Section Not Found</h2>
              <p className="text-gray-700 leading-relaxed">
                The requested admin panel section could not be found. Please select a valid option from the sidebar.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// --- Dummy SVG Icons (replace with actual icon library like react-icons for production) ---
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M12 20.005H12" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10a4 4 0 014 4v2a4 4 0 01-4 4h-4a4 4 0 01-4-4v-2a4 4 0 014-4z" /></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.597 23.597 0 0112 15c-3.183 0-6.22-1.282-8.455-3.66A23.597 23.597 0 013 15v3a2 2 0 002 2h14a2 2 0 002-2v-3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11v1a3 3 0 003 3h4a3 3 0 003-3v-1m4-1H3a2 2 0 00-2 2v4a2 2 0 002 2h18a2 2 0 002-2v-4a2 2 0 00-2-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9V5" /></svg>;
const ScaleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M3 12h18M3 18h18M12 6v12M12 6a9 9 0 00-9 9M12 6a9 9 0 019 9" /></svg>;
const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.05a20.082 20.082 0 011.058-.006 20.082 20.082 0 011.058.006M12 4v16m-4-10H8m8 0h-2m-4 6H8m8 0h-2m-4-6V8m4 0v2m0-2h2m-4 4v2m0-2h2m-4 6V18m4 0v2" /></svg>;
const CogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.52-1.57 1.76-1.57 2.28 0l.542 1.637a2.015 2.015 0 001.218 1.218l1.637.542c1.57.52 1.57 1.76 0 2.28l-1.637.542a2.015 2.015 0 00-1.218 1.218l-.542 1.637c-.52 1.57-1.76 1.57-2.28 0l-.542-1.637a2.015 2.015 0 00-1.218-1.218l-1.637-.542c-1.57-.52-1.57-1.76 0-2.28l1.637-.542a2.015 2.015 0 001.218-1.218l.542-1.637z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15a3 3 0 100-6 3 3 0 000 6z" /></svg>;
const ClipboardListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
// --- End Dummy SVG Icons ---


export const getServerSideProps: GetServerSideProps<AdminPanelProps> = async (context) => {
  const { req, res } = context;

  // Use getServerSession from NextAuth.js to retrieve the user's session.
  // This is the secure, server-side method to verify authentication and retrieve session data.
  const session = await getServerSession(req, res, authOptions);

  // Enforce role-based access:
  // Check if a session exists AND if the authenticated user has the 'admin' role.
  // The UserSession interface expects 'id' and 'role' to be present on 'session.user',
  // which implies your NextAuth.js callbacks are configured to augment the session with these properties.
  const isAdmin = session && session.user && session.user.role === 'admin';

  if (!isAdmin) {
    // If not authenticated or not an admin, redirect to the login page.
    // The `error=unauthorized` query parameter can be used on the login page
    // to display an appropriate message to the user.
    return {
      redirect: {
        destination: '/login?error=unauthorized',
        permanent: false, // Use false for temporary redirects, true for permanent
      },
      // Alternatively, you could return `notFound: true` to respond with a 404
      // and prevent revealing the page's existence to unauthorized users.
      // return { notFound: true };
    };
  }

  // If the session is valid and the user is an admin, pass the session data as props to the page.
  // The type assertion `session as UserSession` is safe here because the `isAdmin` check
  // ensures `session` is not null and has the required `user.role`.
  return {
    props: {
      session: session as UserSession,
      // Any additional data required for the initial load of the admin panel (e.g., summary stats)
      // can be fetched here and passed as props, minimizing client-side loading states.
      // e.g., dashboardSummary: await fetchAdminSummaryData(session.user.id)
    },
  };
};

export default AdminPanelPage;