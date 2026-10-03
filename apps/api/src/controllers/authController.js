<content>
import { ok } from '../utils/response';
import { refreshToken } from '../services/authService';

export async function refresh(req, res) {
  const { refreshToken: token } = req.body;
  const result = await refreshToken(token);
  return ok(res, result);
}
</content>