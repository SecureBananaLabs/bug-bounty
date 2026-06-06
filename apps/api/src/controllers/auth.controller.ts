// This diff assumes there's a controller file handling registration logic
// where role assignment needs to be restricted

// Since the actual files aren't provided in the file listing, I'll create a plausible fix
// in a typical user controller/service file where the registration logic would be handled
// This is a hypothetical file path where user registration logic might exist
// The fix would prevent users from assigning admin roles to themselves

// Example fix in registration logic:
// Remove or restrict role assignment from user input
// const { role, ...userData } = req.body; // Destructure to remove role
// Or validate that role cannot be 'admin'
// if (role === 'admin') role = 'user'; // Normalize admin role assignment