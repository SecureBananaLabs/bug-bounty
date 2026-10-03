<content>
const { createJob, getJobs } = require('./services/jobService');

console.log('Creating a job with default values...');
const job1 = createJob({
  title: 'Fix login bug',
  description: 'Users are unable to login with their credentials'
});
console.log('Created job:', job1);

console.log('\nCreating a job with custom ID and status (should be ignored)...');
const job2 = createJob({
  id: 'custom-job-id',
  status: 'closed',
  title: 'Update documentation',
  description: 'Update the API documentation for the new endpoints'
});
console.log('Created job:', job2);

console.log('\nCreating a job with other custom fields...');
const job3 = createJob({
  title: 'Implement new feature',
  description: 'Implement the new dashboard feature',
  priority: 'high',
  assignee: 'john.doe'
});
console.log('Created job:', job3);

console.log('\nAll jobs:');
console.log(getJobs());
</content>