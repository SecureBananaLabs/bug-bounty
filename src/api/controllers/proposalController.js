<content>
const proposalService = require("../services/proposalService");

const getAllProposals = async (req, res) => {
  try {
    const proposals = await proposalService.getAllProposals();
    res.status(200).json(proposals);
  } catch (error) {
    res.status(500).json({ message: "Error fetching proposals", error: error.message });
  }
};

const postProposal = async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.id; // Assuming authMiddleware attaches user to req

    const newProposal = await proposalService.createProposal({
      title,
      description,
      userId,
    });

    res.status(201).json(newProposal);
  } catch (error) {
    res.status(500).json({ message: "Error creating proposal", error: error.message });
  }
};

module.exports = {
  getAllProposals,
  postProposal,
};