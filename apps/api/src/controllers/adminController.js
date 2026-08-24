import { ok } from "../utils/response.js";
import { getAdminMetrics } from "../services/adminService.js";

export async function metrics(req, res) {
  return ok(res, await getAdminMetrics());
}
  }
}

async function processManualPayout(req, res) {
  try {
    const { proposalId, txHash, method } = req.body;
    if (!proposalId || !txHash) {
      return res.status(400).json({ error: 'proposalId and txHash are required' });
    }
    
    const proposal = await paymentService.processManualPayout(proposalId, txHash, method);
    
    res.json({ success: true, message: 'Manual payout recorded', proposal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getUsers,
  banUser,
  unbanUser,
  approveBounty,
  processManualPayout
};
