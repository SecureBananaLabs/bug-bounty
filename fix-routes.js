import fs from 'fs';
import path from 'path';

const routes = [
  'jobRoutes.js',
  'proposalRoutes.js',
  'reviewRoutes.js',
  'messageRoutes.js',
  'notificationRoutes.js',
  'userRoutes.js'
];

for (const routeFile of routes) {
  const filePath = path.join('apps/api/src/routes', routeFile);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('authMiddleware')) {
    content = content.replace('import { Router } from "express";', 'import { Router } from "express";\nimport { authMiddleware } from "../middleware/auth.js";');
    content = content.replace(/\.post\("\/", (.*)\);/, '.post("/", authMiddleware, $1);');
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${routeFile}`);
  }
}
