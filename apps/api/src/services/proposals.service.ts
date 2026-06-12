import { v4 as uuidv4 } from 'uuid';
import { CreateProposalDto } from '../dtos/create-proposal.dto';

export class ProposalsService {
  async createProposal(createProposalDto: CreateProposalDto): Promise<any> {
    const id = uuidv4(); // Generate a unique id
    const proposal = { id, ...createProposalDto }; // Assign generated id after spreading payload fields
    // Save proposal to database
    return proposal;
  }
}