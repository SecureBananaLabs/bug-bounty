# DB Connection Fix

## Bug
El endpoint `/api/health` devolvía `{ ok: true, db: false }` porque la función `connectDb()` usaba un mock placeholder en lugar de conectar a la base de datos real.

## Fix
- Reemplacé el mock por un PrismaClient real que se inicializa usando `process.env.DATABASE_URL`.
- El cliente se instancia y conecta una sola vez (singleton) y se reutiliza en cada llamada.
- Ahora `/api/health` devuelve `{ ok: true, db: true }` si la conexión es exitosa.

## Testing
- Ejecutar `npm install` y `npm run db:migrate` para preparar la DB.
- Iniciar la app con `npm start` y hacer GET http://localhost:4000/health. Debe responder `{ ok: true, db: true }`.

Queda listo para ser enviado al maintainer como PR.
