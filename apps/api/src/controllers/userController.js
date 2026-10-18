import { ok, fail } from '../utils/response.js';
import { createUser } from '../services/userService.js';
import { createUserSchema } from '../validations/userValidation.js';

export async function postUser(req, res) {
  try {
    const parsed = createUserSchema.parse(req.body);
    const user = await createUser(parsed);
    return ok(res, user, 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return fail(res, 400, 'Validation error', err.errors);
    }
    throw err; // let other errors go to global error handler
  }
}
