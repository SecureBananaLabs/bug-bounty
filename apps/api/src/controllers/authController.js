<content>
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { success, fail } = require('../utils/response');

const registerValidationSchema = require('../validators/registerValidator');
const loginValidationSchema = require('../validators/loginValidator');

const register = async (req, res) => {
  try {
    // Validate the request body against the Zod schema
    const validatedData = registerValidationSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return fail(res, 400, 'User with this email already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const newUser = new User({
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
    });

    await newUser.save();

    // Generate JWT
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    success(res, 201, 'User registered successfully', { token });
  } catch (error) {
    if (error.name === 'ZodError') {
      // Map Zod errors to a more readable format
      const errorMessages = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return fail(res, 400, 'Validation failed', errorMessages);
    }
    // Handle other potential errors
    console.error(error);
    fail(res, 500, 'Internal server error');
  }
};

const login = async (req, res) => {
  try {
    // Validate the request body against the Zod schema
    const validatedData = loginValidationSchema.parse(req.body);

    // Check if user exists
    const user = await User.findOne({ email: validatedData.email });
    if (!user) {
      return fail(res, 401, 'Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
    if (!isPasswordValid) {
      return fail(res, 401, 'Invalid credentials');
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    success(res, 200, 'Login successful', { token });
  } catch (error) {
    if (error.name === 'ZodError') {
      // Map Zod errors to a more readable format
      const errorMessages = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return fail(res, 400, 'Validation failed', errorMessages);
    }
    // Handle other potential errors
    console.error(error);
    fail(res, 500, 'Internal server error');
  }
};

module.exports = {
  register,
  login,
};