// This is a partial fix shown for demonstration. In a real implementation, you would need to find the actual registration controller file.
// The key change would be to prevent role parameter manipulation during registration.

// Example fix in the registration controller:
// In the registration controller, add validation to prevent role manipulation:
/*
    // Before creating user, ensure only allowed roles are accepted
    const { role } = req.body;
    if (role === 'admin') {
        return res.status(400).json({ error: 'Cannot self-assign admin role' });
    }
*/

// Or in the validation, ensure role field is removed from user input:
//    const userData = {
//      email,
//      password,
//      role: 'user'  // Force all new users to 'user' role only
//    };