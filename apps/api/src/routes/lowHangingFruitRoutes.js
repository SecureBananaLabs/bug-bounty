/**
 * Low Hanging Fruit Routes
 * 
 * This file defines the routes for low hanging fruit automation.
 */

const express = require("express");
const lowHangingFruitController = require("../controllers/lowHangingFruitController");
const { auth } = require("../middleware/auth");

const router = express.Router();

/**
 * @route   POST /api/low-hanging-fruit/scan
 * @desc    Scan for low hanging fruit and create issues
 * @access  Private (Admin only)
 */
router.post("/scan", auth, (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }
  next();
}, lowHangingFruitController.scanAndCreateIssues);

module.exports = router;