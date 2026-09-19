import { z } from "zod";

export const uploadFileSchema = z.object({
  // File is handled by multer, but we can validate metadata
}).passthrough();
