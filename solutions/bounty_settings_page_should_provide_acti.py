We need to write code for a settings page that provides actionable account controls. The task mentions JavaScript/TypeScript, React, frontend, HTML/CSS. The user says "Prefer Python unless JS is explicitly required". Since the task explicitly mentions JavaScript/TypeScript, React, frontend, HTML/CSS, we should write JS/TS React code.

We need to produce a complete, runnable code snippet. Likely a React component for Settings page, with mock data, sections: Account/profile, Notifications, Security, Billing/payout preferences. Should match existing frontend style (we don't have that, but we can create a simple styled component using CSS or inline styles). Provide a simple test or example usage at bottom.

We need to output only code, no markdown fences, no explanation before or after.

Thus produce a .js or .jsx file with React component, maybe using functional component, using hooks for state if needed (though static). Provide mock data objects.

We'll also include a simple render to DOM for demonstration (like using ReactDOM.render). Provide a minimal HTML container.

We'll include imports: React, ReactDOM.

We'll style using a CSS module or styled components? Simpler: use inline styles or a <style> tag.

We'll output code only.

Let's produce something like:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';

const mockAccount = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  username: 'janedoe',
  avatarUrl: 'https://i.pravatar.cc/150?img=1',
  bio: 'Software engineer passionate about open source.',
  visibility: 'Public',
};

const mockNotifications = {
  email: true,
  push: false,
  newsletter: true,
  mentions: true,
};

const mockSecurity = {
  twoFactorEnabled: false,
  lastLogin: '2025-10-20 08:15 UTC',
  activeSessions: [
    { device: 'Chrome on Windows', location: 'New York, US', timestamp: '2025-11-02 10:00 UTC' },
    { device: 'Safari on iPhone', location: 'London, UK', timestamp: '2025-11-01 19:30 UTC' },
  ],
  passwordChanged: '2025-09-15',
};

const mockBilling = {
  plan: 'Pro',
  nextBillingDate: '2025-12-01',
  paymentMethod: 'Visa ending in 4242',
  payoutMethod: 'Bank transfer (ending in 1234)',
  payoutThreshold: '$50',
};

function SettingsPage() {
  return (
    <div className="settings-page" style={styles.container}>
      <h1>Settings</h1>
      <section style={styles.section}>
        <h2>Account / Profile</h2>
        <div style={styles.card}>
          <img src={mockAccount.avatarUrl} alt="Avatar" style={styles.avatar} />
          <div>
            <p><strong>Name:</strong> {mockAccount.name}</p>
            <p><strong>Username:</strong> @{mockAccount.username}</p>
            <p><strong>Email:</strong> {mockAccount.email}</p>
            <p><strong>Bio:</strong> {mockAccount.bio}</p>
            <p><strong>Profile Visibility:</strong> {mockAccount.visibility}</p>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <h2>Notifications</h2>
        <div style={styles.card}>
          <p><strong>Email notifications:</strong> {mockNotifications.email ? 'Enabled' : 'Disabled'}</p>
          <p><strong>Push notifications:</strong> {mockNotifications.push ? 'Enabled' : 'Disabled'}</p>
          <p><strong>Newsletter:</strong> {mockNotifications.newsletter ? 'Subscribed' : 'Unsubscribed'}</p>
          <p><strong>Mentions:</strong> {mockNotifications.mentions ? 'Enabled' : 'Disabled'}</p>
        </div>
      </section>

      <section style={styles.section}>
        <h2>Security</h2>
        <div style={styles.card}>
          <p><strong>Two‑Factor Authentication:</strong> {mockSecurity.twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
          <p><strong>Last login:</strong> {mockSecurity.lastLogin}</p>
          <p><strong>Password last changed:</strong> {mockSecurity.passwordChanged}</p>
          <h3>Active Sessions</h3>
          <ul style={styles.sessionList}>
            {mockSecurity.activeSessions.map((s, i) => (
              <li key={i} style={styles.sessionItem}>
                <strong>{s.device}</strong> – {s.location} – {s.timestamp}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section style={styles.section}>
        <h2>Billing / Payout Preferences</h2>
        <div style={styles.card}>
          <p><strong>Current plan:</strong> {mockBilling.plan}</p>
          <p><strong>Next billing date:</strong> {mockBilling.nextBillingDate}</p>
          <p><strong>Payment method:</strong> {mockBilling.paymentMethod}</p>
          <p><strong>Payout method:</strong> {mockBilling.payoutMethod}</p>
          <p><strong>Payout threshold:</strong> {mockBilling.payoutThreshold}</p>
        </div>
      </section>
    </div>
  );
}

// Simple inline styles for demonstration
const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: `'Helvetica Neue', Arial, sans-serif`,
    lineHeight: 1.6,
    color: '#333',
  },
  section: {
    marginBottom: '30px',
  },
  card: {
    background: '#f9f9f9',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  avatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  sessionList: {
    listStyle: 'none',
    padding: 0,
    margin: '8px 0 0',
  },
  sessionItem: {
    padding: '4px 0',
    borderBottom: '1px solid #eee',
  },
};

// Render the component into a root element
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<SettingsPage />);

// Example usage: if this file is run directly, it will render the settings page.
// For testing, you could render to a string or snapshot, but we keep it simple.

```

We need to ensure it's self-contained. Provide a minimal HTML with a div id="root". Since we are outputting only code, we can include that HTML as a string inside a script? Usually we need an HTML file. But we can embed the HTML in a comment? The instruction: "Write complete, runnable code". Could be a single file that includes both JS and HTML using something like `document.write`? Better to create an HTML string and set innerHTML. But typical approach: Provide an HTML file with a script tag. However they said "Prefer Python unless JS is explicitly required". Since JS is required, we can output a .jsx file that assumes a container with id root exists. For completeness, we could also include a minimal HTML template as a string and render using ReactDOM.createRoot on that element.

We can add at top: `if (!document.getElementById('root')) { const div = document.createElement('div'); div.id = 'root'; document.body.appendChild(div); }` Then render.

Thus we don't need external HTML.

Let's adjust code: At start, ensure root div exists.

Add:

```jsx
if (!document.getElementById('root')) {
  const rootDiv = document.createElement('div');
  rootDiv.id = 'root';
  document.body.appendChild(rootDiv);
}
```

Then render.

Add a simple test: maybe render to string using ReactDOMServer? But we can just log that component rendered.

We'll add a comment: // Example usage: open this file in a browser with React and ReactDOM loaded.

But we need to include imports of React and ReactDOM from CDN? In a script we can't use import unless using a bundler. For a self-contained script, we could use UMD builds from unpkg via script tags. However they said "Write complete, runnable code". Usually they'd accept a JSX snippet that assumes React is available globally. But we can also use CDN links in script tags? But we cannot include HTML.

Alternative: Provide a Node.js