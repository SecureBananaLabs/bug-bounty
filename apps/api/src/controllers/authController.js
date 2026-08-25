import { validationResult } from 'express-validator';
import { loginUser, registerUser, refreshAccessToken, requestPasswordReset, resetPassword } from '../services/authService.js';
import { errorResponse, successResponse } from '../utils/response.js';

const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, 'Validation failed', errors.array());
  }
  return null;
};

export const register = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return validationError;

  try {
    const { user, accessToken, refreshToken } = await registerUser(req.body);
    return successResponse(res, 201, 'User registered successfully', { user, accessToken, refreshToken });
  } catch (err) {
    if (err.message === 'Email already in use') {
      return errorResponse(res, 409, 'Email already in use');
    }
    return errorResponse(res, 500, 'Registration failed');
  }
};

export const login = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return validationError;

  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    if (!result) {
      return errorResponse(res, 401, 'Invalid email or password');
    }
    return successResponse(res, 200, 'Login successful', result);
  } catch (err) {
    return errorResponse(res, 500, 'Login failed');
  }
};

export const refresh = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return validationError;

  try {
    const { refreshToken } = req.body;
    const tokens = await refreshAccessToken(refreshToken);
    if (!tokens) {
      return errorResponse(res, 401, 'Invalid refresh token');
    }
    return successResponse(res, 200, 'Token refreshed', tokens);
  } catch (err) {
    return errorResponse(res, 500, 'Token refresh failed');
  }
};

export const forgotPassword = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return validationError;

  try {
    await requestPasswordReset(req.body.email);
    return successResponse(res, 200, 'If the email exists, a reset link has been sent');
  } catch (err) {
    return errorResponse(res, 500, 'Password reset request failed');
  }
};

export const resetPasswordController = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return validationError;

  try {
    const { token, password } = req.body;
    await resetPassword(token, password);
    return successResponse(res, 200, 'Password has been reset');
  } catch (err) {
    return errorResponse(res, 400, 'Invalid or expired reset token');
  }
};
