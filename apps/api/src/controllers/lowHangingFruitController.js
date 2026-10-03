/**
 * Low Hanging Fruit Controller
 * 
 * This controller handles requests related to low hanging fruit automation.
 */

const LowHangingFruitService = require("../services/lowHangingFruitService");
const { success, error } = require("../utils/response");

class LowHangingFruitController {
  constructor() {
    this.lowHangingFruitService = new LowHangingFruitService();
  }

  /**
   * Scan for low hanging fruit and create issues
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async scanAndCreateIssues(req, res) {
    try {
      const createdIssues = await this.lowHangingFruitService.run();
      res.json(success("Low hanging fruit scan completed", createdIssues));
    } catch (err) {
      console.error("Error in scanAndCreateIssues:", err);
      res.status(500).json(error("Failed to scan for low hanging fruit"));
    }
  }
}

module.exports = new LowHangingFruitController();