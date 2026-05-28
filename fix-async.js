import fs from 'fs';
import path from 'path';

const routesDir = 'apps/api/src/routes';
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('catchAsync')) {
    // Add import after express
    content = content.replace('import { Router } from "express";', 'import { Router } from "express";\nimport { catchAsync } from "../utils/catchAsync.js";');
    
    // Wrap the last argument of any route definition
    // Matches router.get("/path", handler) or router.post("/path", middleware, handler)
    content = content.replace(/(\w+Routes\.(get|post|put|delete|patch)\((?:.*?,\s*)+)([\w]+)\);/g, '$1catchAsync($3));');
    
    // Specific fix for authRoutes since it doesn't end in Routes. Wait, it is authRoutes.
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}
