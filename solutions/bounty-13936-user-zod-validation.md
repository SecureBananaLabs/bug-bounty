# Solución para Issue #13936: Validación Estricta con Zod en /api/users

## Resumen Ejecutivo
Se implementa una validación exhaustiva de esquemas con **Zod** para la creación de usuarios en `POST /api/users`. Se bloquean campos maliciosos (contaminación de prototipos), se exige correo conforme a RFC, se validan restricciones de longitud para el nombre y biografía, se restinge el rol a valores permitidos (`cliente` o `freelancer`) y se asegura que las contraseñas nunca se expongan en texto plano.

---

## 1. Esquema de Validación: `src/schemas/userSchema.ts`

```typescript
import { z } from "zod";

export const CreateUserSchema = z
  .object({
    email: z
      .string({ required_error: "El correo electrónico es requerido." })
      .trim()
      .email("Dirección de correo electrónico no compatible con RFC.")
      .max(255, "El correo no debe superar los 255 caracteres."),
    fullName: z
      .string({ required_error: "El nombre completo es requerido." })
      .trim()
      .min(2, "El nombre completo debe tener al menos 2 caracteres.")
      .max(100, "El nombre completo no debe superar los 100 caracteres."),
    bio: z
      .string()
      .trim()
      .max(500, "La biografía no puede exceder los 500 caracteres.")
      .optional()
      .default(""),
    role: z.enum(["cliente", "freelancer"], {
      errorMap: () => ({
        message: "El rol debe ser estrictamente 'cliente' o 'freelancer'.",
      }),
    }),
    password: z
      .string({ required_error: "La contraseña es requerida." })
      .min(8, "La contraseña debe tener al menos 8 caracteres.")
      .max(128, "La contraseña no debe superar los 128 caracteres."),
  })
  .strict(); // Rechaza explícitamente propiedades desconocidas y ataques de prototipo

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
```

---

## 2. Controlador y Rutas: `src/controllers/userController.ts` y `src/routes/userRoutes.ts`

```typescript
import { Router, Request, Response } from "express";
import { ZodError } from "zod";
import { CreateUserSchema } from "../schemas/userSchema";

// Modelo simulado o repositorio en memoria
interface StoredUser {
  id: string;
  email: string;
  fullName: string;
  bio?: string;
  role: "cliente" | "freelancer";
  passwordHash: string; // Excluye contraseñas planas de la persistencia
  createdAt: string;
}

const userDatabase = new Map<string, StoredUser>();

export async function createUserController(req: Request, res: Response) {
  // 1. Validación estricta con Zod
  const parseResult = CreateUserSchema.safeParse(req.body);

  if (!parseResult.success) {
    const formattedErrors = parseResult.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "La carga útil del usuario no supera la validación de esquema.",
        details: formattedErrors,
      },
    });
  }

  const { email, fullName, bio, role, password } = parseResult.data;

  // 2. Verificar duplicidad de correo
  for (const existing of userDatabase.values()) {
    if (existing.email.toLowerCase() === email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "Ya existe un usuario registrado con este correo.",
        },
      });
    }
  }

  // 3. Simulación de Hash seguro (ej. bcrypt / argon2) - Excluyendo plaintext password
  const mockPasswordHash = Buffer.from(password).toString("base64");

  const newUser: StoredUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    email,
    fullName,
    bio,
    role,
    passwordHash: mockPasswordHash,
    createdAt: new Date().toISOString(),
  };

  userDatabase.set(newUser.id, newUser);

  // 4. Sobre de respuesta estructurado sin exponer datos sensibles (excluye contraseña)
  const { passwordHash: _, ...safeUser } = newUser;

  return res.status(201).json({
    success: true,
    data: safeUser,
  });
}

export const userRoutes = Router();
userRoutes.post("/api/users", createUserController);
```

---

## 3. Pruebas de Integración y Servicio: `tests/user.test.ts`

```typescript
import request from "supertest";
import { app } from "../src/app";

describe("POST /api/users - Pruebas de Validación Estricta", () => {
  it("1. Crea exitosamente un usuario con carga útil válida", async () => {
    const validPayload = {
      email: "juan.dev@example.com",
      fullName: "Juan Pérez",
      bio: "Desarrollador fullstack especializado en TypeScript.",
      role: "freelancer",
      password: "SuperSecretPassword123!",
    };

    const res = await request(app).post("/api/users").send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe("juan.dev@example.com");
    expect(res.body.data.role).toBe("freelancer");
    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it("2. Rechaza solicitud con correo electrónico mal formado con HTTP 400", async () => {
    const invalidEmailPayload = {
      email: "correo-invalido-sin-arroba",
      fullName: "Juan Pérez",
      role: "cliente",
      password: "Password123!",
    };

    const res = await request(app).post("/api/users").send(invalidEmailPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
    expect(res.body.error.details[0].field).toBe("email");
  });

  it("3. Rechaza solicitud con fullName ausente o menor a 2 caracteres con HTTP 400", async () => {
    const missingNamePayload = {
      email: "usuario@example.com",
      fullName: "A",
      role: "cliente",
      password: "Password123!",
    };

    const res = await request(app).post("/api/users").send(missingNamePayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.details[0].field).toBe("fullName");
  });

  it("4. Rechaza propiedades desconocidas (anti-pollution) por .strict() con HTTP 400", async () => {
    const pollutedPayload = {
      email: "admin@example.com",
      fullName: "Admin User",
      role: "cliente",
      password: "Password123!",
      __proto__: { isAdmin: true },
      extraProperty: "malicious_field",
    };

    const res = await request(app).post("/api/users").send(pollutedPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
  });

  it("5. Rechaza roles no permitidos distintos de 'cliente' o 'freelancer' con HTTP 400", async () => {
    const invalidRolePayload = {
      email: "test@example.com",
      fullName: "Test User",
      role: "administrador",
      password: "Password123!",
    };

    const res = await request(app).post("/api/users").send(invalidRolePayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.details[0].field).toBe("role");
  });

  it("6. Asegura que la contraseña sensible nunca se devuelva en la respuesta", async () => {
    const payload = {
      email: "seguridad@example.com",
      fullName: "Seguridad User",
      role: "cliente",
      password: "MySuperSecretPassword",
    };

    const res = await request(app).post("/api/users").send(payload);

    expect(res.status).toBe(201);
    expect(JSON.stringify(res.body)).not.toContain("MySuperSecretPassword");
  });
});
```
