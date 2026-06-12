import { Request, Response } from 'express';
import { ProposalsService } from '../services/proposals.service';
import { CreateProposalDto } from '../dtos/create-proposal.dto';

export class ProposalsController {
  private proposalsService: ProposalsService;

  constructor(proposalsService: ProposalsService) {
    this.proposalsService = proposalsService;
  }

  async createProposal(req: Request, res: Response): Promise<void> {
    const createProposalDto: CreateProposalDto = req.body;
    const proposal = await this.proposalsService.createProposal(createProposalDto);
    res.status(201).json(proposal);
  }
}