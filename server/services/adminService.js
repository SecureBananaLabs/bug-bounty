const { faker } = require('@faker-js/faker');

const getAdminMetrics = () => {
  return {
    openJobs: 42,
    activeFreelancers: 185,
    totalRevenue: '$12,345',
    pendingPayments: 7,
    newSignupsToday: 15,
  };
};

const generateFakeReport = (days) => {
  const data = [];
  for (let i = 0; i < days; i++) {
    data.push({
      date: faker.date.past().toISOString(),
      jobsPosted: faker.number.int({ min: 1, max: 50 }),
      earnings: faker.finance.amount({ min: 100, max: 5000 }),
      freelancers: faker.number.int({ min: 10, max: 200 }),
    });
  }
  return data;
};

module.exports = {
  getAdminMetrics,
  generateFakeReport,
};
