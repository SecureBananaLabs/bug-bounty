import { ok } from "../utils/response.js";
const { createUserSchema } = require('../validators/user');
import { createUser, listUsers } from "../services/userService.js";

export async function getUsers(req, res) {
  return ok(res, await listUsers());
}

  const parsed = createUserSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

export async function postUser(req, res) {
    const user = await userService.createUser(parsed.data);
}
  } catch (error) {
    next(error);
  }
};
