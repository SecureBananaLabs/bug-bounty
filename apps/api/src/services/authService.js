import { signAccessToken } from "../utils/jwt.js";

export async function registerUser(payload) {
  // TODO: persist new user via Prisma
  return {
    id: `usr_${Date.now()}`,
    email: payload.email,
    role: payload.role,
    token: signAccessToken({ sub: `usr_${Date.now()}`, role: payload.role })
  };
}

export async function loginUser(payload) {
  // TODO: verify password hash against stored user record
  return {
    email: payload.email,
    token: signAccessToken({ sub: "usr_existing", role: "client" })
  };
}

export async function refreshToken() {
  return { token: signAccessToken({ sub: "usr_existing", role: "client" }) };
import { registerSchema } from '../schemas/authSchemas.js';

export async function registerUser(userData) {
  // Validate input with the updated schema
  const validatedData = registerSchema.parse(userData);
  
  // In a real implementation, this would create the user in the database
  // and return the user object with fullName included
  return {
    id: Date.now(), // placeholder ID generation
    fullName: validatedData.fullName,
    email: validatedData.email,
    role: validatedData.role,
    createdAt: new Date().toISOString(),
  };
}

export default { 
  registerUser 
};
}
