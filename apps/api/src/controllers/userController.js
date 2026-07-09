const userService = require('../services/userService');

function createUser(req, res) {
  try {
    const user = userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({ error: error.message });
    }
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

function getUserById(req, res) {
  const id = parseInt(req.params.id, 10);
  const user = userService.getUserById(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
}

function getAllUsers(req, res) {
  const users = userService.getAllUsers();
  res.json(users);
}

module.exports = { createUser, getUserById, getAllUsers };
