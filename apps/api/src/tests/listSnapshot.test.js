const userService = require('../services/userService');
const jobService = require('../services/jobService');
const proposalService = require('../services/proposalService');
const reviewService = require('../services/reviewService');
const messageService = require('../services/messageService');
const notificationService = require('../services/notificationService');

describe('List service responses are defensive snapshots', () => {
  it('userService.listUsers returns a snapshot', () => {
    const list1 = userService.listUsers();
    const originalLength = list1.length;
    list1.push({ id: 'injected' });
    list1.length = 0;
    const list2 = userService.listUsers();
    expect(list2.length).toBe(originalLength);
    expect(list2.find(u => u.id === 'injected')).toBeUndefined();
  });

  it('jobService.listJobs returns a snapshot', () => {
    const list1 = jobService.listJobs();
    const originalLength = list1.length;
    list1.push({ id: 'injected' });
    list1.length = 0;
    const list2 = jobService.listJobs();
    expect(list2.length).toBe(originalLength);
  });

  it('proposalService.listProposals returns a snapshot', () => {
    const list1 = proposalService.listProposals();
    const originalLength = list1.length;
    list1.push({ id: 'injected' });
    list1.length = 0;
    const list2 = proposalService.listProposals();
    expect(list2.length).toBe(originalLength);
  });

  it('reviewService.listReviews returns a snapshot', () => {
    const list1 = reviewService.listReviews();
    const originalLength = list1.length;
    list1.push({ id: 'injected' });
    list1.length = 0;
    const list2 = reviewService.listReviews();
    expect(list2.length).toBe(originalLength);
  });

  it('messageService.listMessages returns a snapshot', () => {
    const list1 = messageService.listMessages();
    const originalLength = list1.length;
    list1.push({ id: 'injected' });
    list1.length = 0;
    const list2 = messageService.listMessages();
    expect(list2.length).toBe(originalLength);
  });

  it('notificationService.listNotifications returns a snapshot', () => {
    const list1 = notificationService.listNotifications();
    const originalLength = list1.length;
    list1.push({ id: 'injected' });
    list1.length = 0;
    const list2 = notificationService.listNotifications();
    expect(list2.length).toBe(originalLength);
  });
});
