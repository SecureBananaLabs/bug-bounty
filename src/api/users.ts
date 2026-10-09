import { Request, Response } from 'express';
import { createUser, getUserById, updateRole, deleteRole, addUserToRole, removeUserFromRole } from '../services/userService.js';
import { authenticateRequest } from '../middleware/auth.js';
import { logAccess, logAction } from '../utils/logger.js';

export const usersRouter = (app: import('express').Application) => {
  // Get all users (admin only)
  app.get('/api/users', authenticateRequest, async (req: Request, res: Response) => {
    try {
      logAccess(req, 'GET', '/api/users');
      
      // Check if user has admin role
      const userRoles = req.user?.roles || [];
      if (!userRoles.includes('admin')) {
        res.status(403).json({ success: false, message: 'Admin access required' });
        return;
      }
      
      const { page = 1, limit = 10, role, search } = req.query;
      
      // In a real implementation, these would come from the database
      let users = [
        { id: '1', username: 'admin', email: 'admin@bountyhive.com', roles: ['admin'], status: 'active', createdAt: new Date('2024-01-15') },
        { id: '2', username: 'dev_sarah', email: 'sarah@bountyhive.com', roles: ['submitter'], status: 'active', createdAt: new Date('2024-02-20') },
        { id: '3', username: 'reviewer_mike', email: 'mike@bountyhive.com', roles: ['reviewer'], status: 'active', createdAt: new Date('2024-03-10') },
        { id: '4', username: 'dev_alex', email: 'alex@bountyhive.com', roles: ['submitter'], status: 'inactive', createdAt: new Date('2024-04-05') },
        { id: '5', username: 'analyst_jen', email: 'jen@bountyhive.com', roles: ['analyst'], status: 'active', createdAt: new Date('2024-05-12') },
      ];
      
      // Apply role filter
      if (role) {
        users = users.filter(u => u.roles.includes(role as string));
      }
      
      // Apply search filter
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        users = users.filter(u => 
          u.username.toLowerCase().includes(searchTerm) || 
          u.email.toLowerCase().includes(searchTerm)
        );
      }
      
      // Paginate
      const pageSize = parseInt(limit as string);
      const pageNum = parseInt(page as string);
      const totalPages = Math.ceil(users.length / pageSize);
      const paginatedUsers = users.slice((pageNum - 1) * pageSize, pageNum * pageSize);
      
      res.json({
        success: true,
        data: paginatedUsers,
        meta: {
          page: pageNum,
          limit: pageSize,
          total: users.length,
          totalPages
        }
      });
    } catch (error: any) {
      logAction('ERROR', 'GET', `/api/users`, error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Get user by ID
  app.get('/api/users/:id', authenticateRequest, async (req: Request, res: Response) => {
    try {
      logAccess(req, 'GET', `/api/users/${req.params.id}`);
      
      const user = getUserById(req.params.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      
      res.json({ success: true, data: user });
    } catch (error: any) {
      logAction('ERROR', 'GET', `/api/users/${req.params.id}`, error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Create new user (admin only)
  app.post('/api/users', authenticateRequest, async (req: Request, res: Response) => {
    try {
      logAccess(req, 'POST', '/api/users');
      
      // Check if user has admin role
      const userRoles = req.user?.roles || [];
      if (!userRoles.includes('admin')) {
        res.status(403).json({ success: false, message: 'Admin access required' });
        return;
      }
      
      const { username, email, password, role } = req.body;
      
      if (!username || !email || !password) {
        res.status(400).json({ success: false, message: 'Username, email, and password are required' });
        return;
      }
      
      if (!role) {
        res.status(400).json({ success: false, message: 'Role is required' });
        return;
      }
      
      const newUser = createUser({ username, email, password, role });
      
      logAction('CREATE', 'POST', '/api/users', `Created user: ${newUser.id}`);
      
      res.status(201).json({ success: true, data: newUser });
    } catch (error: any) {
      logAction('ERROR', 'POST', '/api/users', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Update user role
  app.put('/api/users/:id/role', authenticateRequest, async (req: Request, res: Response) => {
    try {
      logAccess(req, 'PUT', `/api/users/${req.params.id}/role`);
      
      const { role } = req.body;
      
      if (!role) {
        res.status(400).json({ success: false, message: 'Role is required' });
        return;
      }
      
      const updatedUser = updateRole(req.params.id, role);
      if (!updatedUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      
      logAction('UPDATE', 'PUT', `/api/users/${req.params.id}/role`, `Updated role to: ${role}`);
      
      res.json({ success: true, data: updatedUser });
    } catch (error: any) {
      logAction('ERROR', 'PUT', `/api/users/${req.params.id}/role`, error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Delete user (admin only)
  app.delete('/api/users/:id', authenticateRequest, async (req: Request, res: Response) => {
    try {
      logAccess(req, 'DELETE', `/api/users/${req.params.id}`);
      
      // Check if user has admin role
      const userRoles = req.user?.roles || [];
      if (!userRoles.includes('admin')) {
        res.status(403).json({ success: false, message: 'Admin access required' });
        return;
      }
      
      const deleted = deleteRole(req.params.id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      
      logAction('DELETE', 'DELETE', `/api/users/${req.params.id}`, `Deleted user: ${req.params.id}`);
      
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error: any) {
      logAction('ERROR', 'DELETE', `/api/users/${req.params.id}`, error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Add user to role
  app.post('/api/users/:id/roles/:role', authenticateRequest, async (req: Request, res: Response) => {
    try {
      logAccess(req, 'POST', `/api/users/${req.params.id}/roles/${req.params.role}`);
      
      const user = addUserToRole(req.params.id, req.params.role);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found or role does not exist' });
        return;
      }
      
      res.json({ success: true, data: user });
    } catch (error: any) {
      logAction('ERROR', 'POST', `/api/users/${req.params.id}/roles/${req.params.role}`, error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Remove user from role
  app.delete('/api/users/:id/roles/:role', authenticateRequest, async (req: Request, res: Response) => {
    try {
      logAccess(req, 'DELETE', `/api/users/${req.params.id}/roles/${req.params.role}`);
      
      const user = removeUserFromRole(req.params.id, req.params.role);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found or role does not exist' });
        return;
      }
      
      res.json({ success: true, data: user });
    } catch (error: any) {
      logAction('ERROR', 'DELETE', `/api/users/${req.params.id}/roles/${req.params.role}`, error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  });
};
