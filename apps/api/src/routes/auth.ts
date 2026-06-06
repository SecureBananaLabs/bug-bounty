    const { email, password, role, ...userData } = req.body;
    
    // Validate required fields
    if (!email || !password || role === 'admin') {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Prevent admin role self-assignment
    if (role === 'admin') {
        return res.status(400).json({ error: 'Admin role cannot be self-assigned' });
    }
    
    try {
        // Check if user already exists