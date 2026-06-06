    const { email, password, role, ...userData } = req.body;
    
    // Basic validation
    if (!email || !password || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Prevent admin role self-assignment
    if (role?.toLowerCase() === 'admin') {
        return res.status(400).json({ error: 'Admin role cannot be self-assigned during registration' });
    }
    
    // Hash password