import { object, string, enum_, boolean } from 'yup';

export const createUserSchema = object().shape({
  name: string().required().min(3).max(50),
  email: string().email().required().max(100),
  role: enum_(['public', 'admin', 'moderator']).required()
});