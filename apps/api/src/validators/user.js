const { body, validationResult } = require('express-validator');

// RFC 5322 compliant email regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const validateCreateUser = [
  body('email')
    .exists({ checkFalsy: true })
    .withMessage('Valid email is required')
    .isString()
    .withMessage('Valid email is required')
    .matches(EMAIL_REGEX)
    .withMessage('Valid email is required'),
  body('password')
    .exists({ checkFalsy: true })
    .withMessage('Password is required')
    .isString()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name must be at most 100 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = { validateCreateUser };
