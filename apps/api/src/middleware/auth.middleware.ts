    }

    req.user = decoded;
    req.user.id = decoded.userId || decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });