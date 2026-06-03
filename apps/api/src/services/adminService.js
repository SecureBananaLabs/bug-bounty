/**
 * Admin Service - Full admin panel with mock data
 * All data is in-memory, matching the pattern of existing services
 */

// In-memory mock data
let flags = [
  { id: 'flag-1', jobId: 'job-1', flaggedById: 'user-3', reason: 'Inappropriate content', status: 'FLAGGED', adminResponse: null, job: { id: 'job-1', title: 'Build a website urgently', client: { id: 'user-2', fullName: 'Jane Smith' } }, createdAt: new Date(Date.now() - 86400000) },
  { id: 'flag-2', jobId: 'job-3', flaggedById: 'user-5', reason: 'Suspected scam - too good to be true', status: 'FLAGGED', adminResponse: null, job: { id: 'job-3', title: '$10k for simple data entry', client: { id: 'user-4', fullName: 'Bob Wilson' } }, createdAt: new Date(Date.now() - 172800000) },
  { id: 'flag-3', jobId: 'job-5', flaggedById: 'user-1', reason: 'Duplicate listing', status: 'APPROVED', adminResponse: 'Not a duplicate, approved', job: { id: 'job-5', title: 'React Native Developer', client: { id: 'user-6', fullName: 'Alice Brown' } }, createdAt: new Date(Date.now() - 259200000) },
];

let disputes = [
  { id: 'disp-1', jobId: 'job-2', raisedById: 'user-3', defendantId: 'user-1', reason: 'Freelancer did not deliver on time', status: 'OPEN', ruling: null, resolution: null, raisedByUser: { id: 'user-3', fullName: 'Charlie Davis' }, defendant: { id: 'user-1', fullName: 'John Doe' }, job: { id: 'job-2', title: 'WordPress Theme Customization' }, createdAt: new Date(Date.now() - 43200000) },
  { id: 'disp-2', jobId: 'job-4', raisedById: 'user-1', defendantId: 'user-4', reason: 'Client refused to pay after delivery', status: 'UNDER_REVIEW', ruling: null, resolution: null, raisedByUser: { id: 'user-1', fullName: 'John Doe' }, defendant: { id: 'user-4', fullName: 'Bob Wilson' }, job: { id: 'job-4', title: 'Logo Design for Startup' }, createdAt: new Date(Date.now() - 129600000) },
  { id: 'disp-3', jobId: 'job-6', raisedById: 'user-5', defendantId: 'user-2', reason: 'Work was not as specified', status: 'RESOLVED', ruling: 'FREELANCER', resolution: 'Resolved in favor of freelancer - partial payment released', raisedByUser: { id: 'user-5', fullName: 'Eve Martin' }, defendant: { id: 'user-2', fullName: 'Jane Smith' }, job: { id: 'job-6', title: 'Mobile App UI Design' }, createdAt: new Date(Date.now() - 604800000) },
];

let platformSettings = {
  registrationOpen: 'true',
  jobPostingOpen: 'true',
  commissionRate: '10',
  minPayout: '50',
  supportEmail: 'support@freelanceflow.com',
  maintenanceMode: 'false',
};

let disputeMessages = {
  'disp-1': [
    { id: 'msg-1', senderId: 'user-3', sender: { fullName: 'Charlie Davis' }, body: 'I hired John for a WordPress theme customization with a 2-week deadline. It has been 3 weeks and he has not delivered.', createdAt: new Date(Date.now() - 43200000) },
    { id: 'msg-2', senderId: 'user-1', sender: { fullName: 'John Doe' }, body: 'I have completed the work but the client kept asking for additional changes beyond the original scope.', createdAt: new Date(Date.now() - 36000000) },
    { id: 'msg-3', senderId: 'admin', sender: { fullName: 'Admin' }, body: 'Could both parties please provide the original contract and scope document?', createdAt: new Date(Date.now() - 28800000) },
  ],
};

class AdminError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const adminService = {
  async getMetrics() {
    return {
      totalUsers: 1285,
      activeJobs: 342,
      openDisputes: disputes.filter(d => d.status === 'OPEN').length,
      flaggedListings: flags.filter(f => f.status === 'FLAGGED').length,
      monthlyVolume: 128900,
      newRegistrationsThisMonth: 89,
      avgResponseTime: '4.2h',
      trustScoreAvg: 4.3,
    };
  },

  async getUsers({ page = 1, limit = 20, search = '', role, status }) {
    const allUsers = [
      { id: 'user-1', email: 'john@example.com', fullName: 'John Doe', role: 'FREELANCER', status: 'ACTIVE', isVerified: true, createdAt: '2025-11-15T10:00:00Z', bio: 'Full-stack developer with 8 years experience' },
      { id: 'user-2', email: 'jane@example.com', fullName: 'Jane Smith', role: 'CLIENT', status: 'ACTIVE', isVerified: true, createdAt: '2025-12-01T08:30:00Z', bio: 'Startup founder' },
      { id: 'user-3', email: 'charlie@example.com', fullName: 'Charlie Davis', role: 'CLIENT', status: 'SUSPENDED', isVerified: false, createdAt: '2026-01-10T14:00:00Z', bio: 'Small business owner' },
      { id: 'user-4', email: 'bob@example.com', fullName: 'Bob Wilson', role: 'FREELANCER', status: 'BANNED', isVerified: false, createdAt: '2026-01-20T09:00:00Z', bio: 'Designer' },
      { id: 'user-5', email: 'eve@example.com', fullName: 'Eve Martin', role: 'FREELANCER', status: 'ACTIVE', isVerified: true, createdAt: '2026-02-05T11:00:00Z', bio: 'Mobile developer' },
      { id: 'user-6', email: 'alice@example.com', fullName: 'Alice Brown', role: 'CLIENT', status: 'ACTIVE', isVerified: true, createdAt: '2026-02-15T16:00:00Z', bio: 'Tech recruiter' },
      { id: 'user-7', email: 'admin@freelanceflow.com', fullName: 'Admin User', role: 'ADMIN', status: 'ACTIVE', isVerified: true, createdAt: '2025-10-01T00:00:00Z', bio: 'Platform admin' },
    ];

    let filtered = [...allUsers];
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(u => u.fullName.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
    }
    if (role) filtered = filtered.filter(u => u.role === role);
    if (status) filtered = filtered.filter(u => u.status === status);

    const total = filtered.length;
    const start = (page - 1) * limit;
    const users = filtered.slice(start, start + limit);

    return { users, total, page, limit };
  },

  async getUserDetail(userId) {
    const user = [
      { id: 'user-1', email: 'john@example.com', fullName: 'John Doe', role: 'FREELANCER', status: 'ACTIVE', isVerified: true, createdAt: '2025-11-15T10:00:00Z', bio: 'Full-stack developer' },
      { id: 'user-2', email: 'jane@example.com', fullName: 'Jane Smith', role: 'CLIENT', status: 'ACTIVE', isVerified: true, createdAt: '2025-12-01T08:30:00Z', bio: 'Startup founder' },
    ].find(u => u.id === userId);

    if (!user) throw new AdminError('User not found', 404);

    const activeJobs = [
      { id: 'job-1', title: 'Build a website', status: 'IN_PROGRESS', budgetMin: 2000, budgetMax: 5000 },
      { id: 'job-2', title: 'WordPress Theme', status: 'OPEN', budgetMin: 500, budgetMax: 1500 },
    ];

    const disputeHistory = disputes.filter(d => d.raisedById === userId || d.defendantId === userId);

    return { user, activeJobs, disputeHistory };
  },

  async suspendUser(userId) {
    const users = ['user-1', 'user-2', 'user-3', 'user-5', 'user-6'];
    if (!users.includes(userId)) throw new AdminError('User not found', 404);
    if (userId === 'user-7') throw new AdminError('Cannot suspend admin users', 400);
    return { id: userId, status: 'SUSPENDED', message: 'User suspended' };
  },

  async reinstateUser(userId) {
    if (!['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6'].includes(userId))
      throw new AdminError('User not found', 404);
    return { id: userId, status: 'ACTIVE', message: 'User reinstated' };
  },

  async banUser(userId) {
    const users = ['user-1', 'user-2', 'user-3', 'user-5', 'user-6'];
    if (!users.includes(userId)) throw new AdminError('User not found', 404);
    if (userId === 'user-7') throw new AdminError('Cannot ban admin users', 400);
    return { id: userId, status: 'BANNED', message: 'User permanently banned' };
  },

  async getModerationQueue() {
    return flags.filter(f => f.status === 'FLAGGED');
  },

  async approveJob(flaggedId) {
    const flag = flags.find(f => f.id === flaggedId);
    if (!flag) throw new AdminError('Flagged job not found', 404);
    flag.status = 'APPROVED';
    flag.adminResponse = 'Approved by admin';
    return flag;
  },

  async rejectJob(flaggedId, reason) {
    const flag = flags.find(f => f.id === flaggedId);
    if (!flag) throw new AdminError('Flagged job not found', 404);
    flag.status = 'REJECTED';
    flag.adminResponse = reason || 'Rejected by admin';
    return flag;
  },

  async getDisputes() {
    return disputes;
  },

  async getDisputeDetail(disputeId) {
    const dispute = disputes.find(d => d.id === disputeId);
    if (!dispute) throw new AdminError('Dispute not found', 404);
    return {
      ...dispute,
      messages: disputeMessages[disputeId] || [],
    };
  },

  async resolveDispute(disputeId, ruling) {
    const dispute = disputes.find(d => d.id === disputeId);
    if (!dispute) throw new AdminError('Dispute not found', 404);
    if (dispute.status === 'RESOLVED') throw new AdminError('Dispute already resolved', 400);
    if (!['FREELANCER', 'CLIENT'].includes(ruling)) throw new AdminError('Ruling must be FREELANCER or CLIENT', 400);

    dispute.status = 'RESOLVED';
    dispute.ruling = ruling;
    dispute.resolution = `Resolved in favor of ${ruling.toLowerCase()}`;

    return dispute;
  },

  async getPlatformSettings() {
    return { ...platformSettings };
  },

  async updatePlatformSettings(settings) {
    Object.assign(platformSettings, settings);
    return { ...platformSettings };
  },
};
