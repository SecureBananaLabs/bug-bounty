# Solución para Issue #13935: Validación de Archivos en /api/upload

## Resumen Ejecutivo
Se refuerza el endpoint de subida de archivos `POST /api/upload` implementando validaciones estrictas de tamaño, tipo MIME y extensión de archivo, evitando denegaciones de servicio (DoS) por sobrecarga y ejecuciones remotas de código (RCE) por subida de ejecutables/scripts.

---

## 1. Implementación: `src/routes/uploadRoutes.ts` y `src/controllers/uploadController.ts`

```typescript
import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "node:path";

// 1. Constantes y Lista Blanca Estricta
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".pdf",
  ".txt",
]);

const DANGEROUS_EXTENSIONS = new Set([
  ".sh",
  ".exe",
  ".bat",
  ".cmd",
  ".php",
  ".phtml",
  ".py",
  ".pl",
  ".cgi",
  ".js",
  ".vbs",
  ".ps1",
]);

// 2. Almacenamiento y filtro de archivos
const storage = multer.memoryStorage();

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const ext = path.extname(file.originalname).toLowerCase();

  // Rechazo explícito de ejecutables y scripts peligrosos
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return cb(
      new Error(`Tipo de archivo ejecutable o peligroso denegado: "${ext}"`)
    );
  }

  // Validación de lista blanca (extensión y MIME type)
  if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(
      new Error(
        "Tipo de archivo no permitido. Tipos válidos: PNG, JPEG, WEBP, GIF, PDF, TXT."
      )
    );
  }

  cb(null, true);
}

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter,
});

// 3. Controlador con sobre de respuesta estándar
export async function handleFileUpload(req: Request, res: Response) {
  // Requisito 1: Rechazar solicitudes sin archivo con 400 Bad Request
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: {
        code: "NO_FILE_PROVIDED",
        message: "No se proporciona archivo. Adjunta un archivo en el campo 'file'.",
      },
    });
  }

  const { originalname, mimetype, size } = req.file;

  // Requisito 4: Sobre estructurado de éxito
  return res.status(200).json({
    success: true,
    data: {
      filename: path.basename(originalname),
      mimetype,
      sizeBytes: size,
      uploadedAt: new Date().toISOString(),
    },
  });
}

// 4. Manejador de errores para límites y rechazos (400 Bad Request)
export function handleUploadErrors(
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: {
          code: "FILE_TOO_LARGE",
          message: "El archivo excede el tamaño máximo permitido de 10 MB.",
        },
      });
    }

    return res.status(400).json({
      success: false,
      error: {
        code: "UPLOAD_ERROR",
        message: err.message,
      },
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_FILE_TYPE",
        message: err.message || "Error al procesar el archivo.",
      },
    });
  }

  next();
}

// 5. Rutas
export const uploadRoutes = Router();
uploadRoutes.post(
  "/api/upload",
  upload.single("file"),
  handleFileUpload,
  handleUploadErrors
);
```

---

## 2. Pruebas de Integración: `tests/upload.test.ts`

```typescript
import request from "supertest";
import { app } from "../src/app";

describe("POST /api/upload - Pruebas de Integración", () => {
  it("1. Rechaza solicitudes sin archivo con HTTP 400", async () => {
    const res = await request(app).post("/api/upload").send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("NO_FILE_PROVIDED");
  });

  it("2. Sube exitosamente un archivo PNG permitido dentro del límite", async () => {
    const validPngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);

    const res = await request(app)
      .post("/api/upload")
      .attach("file", validPngBuffer, "test-image.png");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.filename).toBe("test-image.png");
    expect(res.body.data.mimetype).toBe("image/png");
  });

  it("3. Rechaza archivos mayores a 10 MB con HTTP 400", async () => {
    const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024);

    const res = await request(app)
      .post("/api/upload")
      .attach("file", oversizedBuffer, "large-document.pdf");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("FILE_TOO_LARGE");
  });

  it("4. Rechaza extensiones peligrosas (.sh, .exe, .bat, .php) con HTTP 400", async () => {
    const maliciousScript = Buffer.from("#!/bin/bash\nrm -rf /");

    const res = await request(app)
      .post("/api/upload")
      .attach("file", maliciousScript, "script.sh");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/denegado|peligroso/i);
  });

  it("5. Rechaza tipos MIME no autorizados con HTTP 400", async () => {
    const dummyBuffer = Buffer.from("dummy data");

    const res = await request(app)
      .post("/api/upload")
      .attach("file", dummyBuffer, {
        filename: "test.xyz",
        contentType: "application/octet-stream",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
```
