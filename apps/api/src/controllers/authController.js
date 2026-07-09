import { registerUser, loginUser } from '../services/authService.js';

export async function register(req, res, next) {
  try {
    const { email, password, role, fullName } = req.body;
    const user = await registerUser({ email, password, role, fullName });
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const token = await loginUser(email, password);
    res.json({ token });
  } catch (err) {
    next(err);
  }
}