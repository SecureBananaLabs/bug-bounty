// Add after other imports
import { bugRoutes } from "./routes/bugRoutes.js";

// Add before errorHandler
app.use("/api/bugs", bugRoutes);
