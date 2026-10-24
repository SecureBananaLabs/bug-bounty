import express from "express";
import messageRouter from "./routes/messageRoutes";

const app = express();

app.use(express.json({ limit: "32kb" }));
app.use("/api/messages", messageRouter);

export default app;
