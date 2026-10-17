// Add at top
import cron from 'node-cron';
import { detectAndCreateIssues } from './services/bugDetection';

// Add before app.listen()
cron.schedule('0 3 * * *', () => { // Daily at 3 AM
  console.log('Starting automated bug detection...');
  detectAndCreateIssues();
});
