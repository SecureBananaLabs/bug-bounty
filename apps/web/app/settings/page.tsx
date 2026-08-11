export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      <section className="mb-8 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Profile</h2>
        <div className="space-y-3">
          <div><label className="block text-sm font-medium">Username</label><input className="w-full p-2 border rounded" disabled value="demo_user" /></div>
          <div><label className="block text-sm font-medium">Email</label><input className="w-full p-2 border rounded" disabled value="user@example.com" /></div>
        </div>
      </section>
      <section className="mb-8 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Actions</h2>
        <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Delete Account</button>
      </section>
    </div>
  );
}