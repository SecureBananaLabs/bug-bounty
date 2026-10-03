/**
 * Server Setup
 * 
 * This file sets up the Express server and middleware.
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { authRoutes } = require("./routes/authRoutes");
const { userRoutes } = require("./routes/userRoutes");
const { jobRoutes } = require("./routes/jobRoutes");
const { proposalRoutes } = require("./routes/proposalRoutes");
const { messageRoutes } = require("./routes/messageRoutes");
const { notificationRoutes } = require("./routes/notificationRoutes");
const { paymentRoutes } = require("./routes/paymentRoutes");
const { reviewRoutes } = require("./routes/reviewRoutes");
const { searchRoutes } = require("./routes/searchRoutes");
const { uploadRoutes } = require("./routes/uploadRoutes");
const { adminRoutes } = require("./routes/adminRoutes");
const { lowHangingFruitRoutes } = require("./routes/lowHangingFruitRoutes");
const { errorHandler } = require("./middleware/errorHandler");
const { notFound } = require("./middleware/errorHandler");

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/low-hanging-fruit", lowHangingFruitRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;