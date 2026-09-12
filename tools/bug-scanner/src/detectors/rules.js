import path from "node:path";
import { lineNumberAt } from "../fs-utils.js";

const ZOD_PARSE_PATTERN = /\.parse\s*\(\s*req\.body\s*\)/;

function controllersProbePath(handlerRelativePath) {
  const controllersDir = path
    .normalize(path.join(path.dirname(handlerRelativePath), "../controllers"))
    .replace(/\\/g, "/");
  return `${controllersDir}/.scan-hint.js`;
}

function zodRelatedFiles(zodParseFiles, handlerRelativePath) {
  if (zodParseFiles.length > 0) {
    return zodParseFiles.map(({ relativePath }) => relativePath);
  }

  if (handlerRelativePath) {
    return [controllersProbePath(handlerRelativePath)];
  }

  return [];
}

export function detectMissingZodErrorHandler({ rootDir, files, readFile }) {
  const findings = [];
  const sourceFiles = files.map((filePath) => ({
    filePath,
    content: readFile(filePath),
    relativePath: path.relative(rootDir, filePath)
  }));

  const zodParseFiles = sourceFiles.filter(({ content }) => ZOD_PARSE_PATTERN.test(content));
  const usesZodParse = zodParseFiles.length > 0;

  const errorHandler = sourceFiles.find(({ relativePath }) =>
    relativePath.replace(/\\/g, "/").endsWith("middleware/errorHandler.js")
  );

  if (!errorHandler) {
    if (!usesZodParse) {
      return findings;
    }

    findings.push({
      id: "missing-zod-error-handler",
      severity: "medium",
      title: "Zod validation errors are not handled centrally",
      file: "apps/api/src/middleware/errorHandler.js",
      line: 1,
      description:
        "Controllers call schema.parse(req.body) but no global error handler maps ZodError to a 422 response.",
      recommendation:
        "Import ZodError in errorHandler.js and return HTTP 422 with field-level validation details.",
      relatedFiles: zodRelatedFiles(zodParseFiles, null)
    });
    return findings;
  }

  const handlesZod =
    /ZodError/.test(errorHandler.content) ||
    /from\s+["']zod["']/.test(errorHandler.content);

  if (!handlesZod) {
    findings.push({
      id: "missing-zod-error-handler",
      severity: "medium",
      title: "Zod validation errors return generic HTTP 500 responses",
      file: errorHandler.relativePath,
      line: 1,
      description:
        "Unhandled ZodError instances from schema.parse(req.body) bubble into the global error handler and become opaque 500 responses.",
      recommendation:
        "Add an instanceof ZodError branch that responds with status 422 and structured field errors.",
      relatedFiles: zodRelatedFiles(zodParseFiles, errorHandler.relativePath)
    });
  }

  return findings;
}

export function detectUnvalidatedRequestBody({ rootDir, files, readFile }) {
  const findings = [];
  const controllerPattern =
    /export\s+async\s+function\s+(\w+)\s*\([^)]*\)\s*\{[\s\S]*?await\s+\w+\(\s*req\.body\s*\)/g;

  for (const filePath of files) {
    const relativePath = path.relative(rootDir, filePath);
    if (!relativePath.replace(/\\/g, "/").includes("/controllers/")) {
      continue;
    }

    const content = readFile(filePath);
    let match;
    while ((match = controllerPattern.exec(content)) !== null) {
      const handlerName = match[1];
      const snippet = match[0];
      if (/\.parse\s*\(\s*req\.body\s*\)/.test(snippet)) {
        continue;
      }

      findings.push({
        id: "unvalidated-request-body",
        severity: "high",
        title: `Missing request-body validation in ${handlerName}`,
        file: relativePath,
        line: lineNumberAt(content, match.index),
        description: `${handlerName} forwards req.body to a service without Zod (or similar) validation.`,
        recommendation: "Add a validator schema and call schema.parse(req.body) before invoking the service layer.",
        relatedFiles: [relativePath]
      });
    }
  }

  return findings;
}

export function detectUnprotectedMutatingRoutes({ rootDir, files, readFile }) {
  const findings = [];
  const routeFiles = files.filter((filePath) =>
    path.relative(rootDir, filePath).replace(/\\/g, "/").includes("/routes/")
  );

  for (const filePath of routeFiles) {
    const relativePath = path.relative(rootDir, filePath);
    const content = readFile(filePath);
    const hasAuth = /authMiddleware/.test(content);
    const mutatingRoutes = [...content.matchAll(/\.(post|put|patch|delete)\s*\(\s*["'`][^"'`]+["'`]/gi)];

    if (mutatingRoutes.length === 0 || hasAuth) {
      continue;
    }

    if (relativePath.replace(/\\/g, "/").endsWith("routes/authRoutes.js")) {
      continue;
    }

    const firstMatch = mutatingRoutes[0];
    findings.push({
      id: "unprotected-mutating-route",
      severity: "medium",
      title: "Mutating API route lacks authentication middleware",
      file: relativePath,
      line: lineNumberAt(content, firstMatch.index),
      description: `${relativePath} exposes write endpoints without authMiddleware.`,
      recommendation:
        "Protect state-changing routes with authMiddleware (and role checks where appropriate).",
      relatedFiles: [relativePath]
    });
  }

  return findings;
}

export function detectHardcodedSecrets({ rootDir, files, readFile }) {
  const findings = [];
  const weakDefaultPattern =
    /(jwtSecret|secret|apiKey|password)\s*:\s*process\.env\.[A-Z0-9_]+\s*\?\?\s*["']([^"']+)["']/gi;

  for (const filePath of files) {
    const relativePath = path.relative(rootDir, filePath);
    if (!relativePath.replace(/\\/g, "/").includes("/config/")) {
      continue;
    }

    const content = readFile(filePath);
    let match;
    while ((match = weakDefaultPattern.exec(content)) !== null) {
      const fallback = match[2];
      if (!fallback || fallback.length < 4) {
        continue;
      }

      findings.push({
        id: "hardcoded-secret-fallback",
        severity: "high",
        title: "Insecure default secret in environment config",
        file: relativePath,
        line: lineNumberAt(content, match.index),
        description: `Configuration falls back to a hard-coded default (${JSON.stringify(fallback)}) when an env var is missing.`,
        recommendation:
          "Require secrets via environment variables in non-development environments and fail fast when unset.",
        relatedFiles: [relativePath]
      });
    }
  }

  return findings;
}
