<content>
import Joi from 'joi';

export const registerUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('USER', 'ADMIN').required(),
  fullName: Joi.string().min(2).max(50).required().trim(),
});
</content>