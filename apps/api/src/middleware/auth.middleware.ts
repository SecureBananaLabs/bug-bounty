      return next(new AppError('Invalid token payload', 401));
    }

    // Prevent admin role from being assigned via registration
    if (req.body?.role === 'ADMIN' || req.body?.role === 'admin') {
      delete req.body.role;
    }

    req.user = user;
    next();
  } catch (error) {