<content>
const authService = require('../services/authService');

const login = async (req, res) => {
  try {
    const { token, refreshToken } = await authService.login(req.body);
    res.json({ token, refreshToken });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

const refreshToken = async (req, res) => {
  // Use verified user from authMiddleware instead of hardcoding
  const { sub, role } = req.user;
  try {
    const newToken = await authService.refreshToken({ sub, role });
    res.json({ token: newToken });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

const logout = async (req, res) => {
  // Implementation for logout if needed
  res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
  login,
  refreshToken,
  logout,
};
</content>