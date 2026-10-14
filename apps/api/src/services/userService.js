
const escapeHtml = (str) => String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const users = [];

export async function listUsers() {
  return users;
}

export async function createUser
  body.name = escapeHtml(body.name);(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return user;
}
