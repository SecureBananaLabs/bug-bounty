import { Test, TestingModule } from '@nestjs/testing';
import { ProposalsController } from './proposals.controller';
import { ProposalsService } from './services/proposals.service';
import { CreateProposalDto } from './dtos/create-proposal.dto';

describe('ProposalsController', () => {
  let proposalsController: ProposalsController;
  let proposalsService: ProposalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProposalsController],
      providers: [ProposalsService],
    }).compile();

    proposalsController = module.get<ProposalsController>(ProposalsController);
    proposalsService = module.get<ProposalsService>(ProposalsService);
  });

  it('should create a new proposal with a generated id', async () => {
    const createProposalDto: CreateProposalDto = { jobId: 'job-123', freelancerId: 'freelancer-123', coverLetter: 'I can complete this job.' };
    const result = await proposalsController.createProposal({ body: createProposalDto } as any, {} as any);
    expect(result.id).toBeDefined();
    expect(result.jobId).toBe(createProposalDto.jobId);
    expect(result.freelancerId).toBe(createProposalDto.freelancerId);
    expect(result.coverLetter).toBe(createProposalDto.coverLetter);
  });

  it('should ignore the client-provided id', async () => {
    const createProposalDto: CreateProposalDto = { id: 'client-provided-id', jobId: 'job-123', freelancerId: 'freelancer-123', coverLetter: 'I can complete this job.' };
    const result = await proposalsController.createProposal({ body: createProposalDto } as any, {} as any);
    expect(result.id).not.toBe(createProposalDto.id);
  });
});