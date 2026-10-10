import { randomBytes } from "crypto";
import { SignJWT } from "jose";

interface User {
  id: string;
}

interface JwtPayload {
  sub: string;
}

export class AuthService {
  private users: Map<string, User> = new Map();
  private privateKey: CryptoKey;
  private publicKey: CryptoKey;

  constructor() {
    const keyPair = crypto.subtle.generateKey(
      { name: "ES256", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    );
    this.privateKey = keyPair.privateKey;
    this.publicKey = keyPair.publicKey;
  }

  async registerUser(username: string): Promise<{ userId: string; token: string }> {
    const userId = `user-${Date.now()}-${randomBytes(4).toString("hex")}`;
    this.users.set(userId, { id: userId });

    const token = await new SignJWT({ sub: userId })
      .setProtectedHeader({ alg: "ES256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(this.privateKey);

    return { userId, token };
  }

  async getUser(userId: string): Promise<User | null> {
    return this.users.get(userId) ?? null;
  }

  async verifyToken(token: string): Promise<JwtPayload | null> {
    try {
      const payload = await new SignJWT(token)
        .setProtectedHeader({ alg: "ES256" })
        .verify(this.publicKey);
      return payload as JwtPayload;
    } catch {
      return null;
    }
  }
}
