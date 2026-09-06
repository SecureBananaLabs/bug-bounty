import { applyUploadAuthProtection } from './uploadRoutesSecurity';

describe('Upload Route Security Protection', () => {
  it('should register authMiddleware before upload processing', () => {
    const postCalls = [];
    const mockRouter = {
      post: (...args) => postCalls.push(args)
    };
    const mockUpload = { single: () => 'uploadSingleMiddleware' };
    const mockAuth = 'authMiddleware';
    const mockHandler = 'uploadFileHandler';

    applyUploadAuthProtection(mockRouter, mockUpload, mockAuth, mockHandler);

    expect(postCalls.length).toBe(1);
    expect(postCalls[0][0]).toBe('/');
    expect(postCalls[0][1]).toBe(mockAuth);
    expect(postCalls[0][2]).toBe('uploadSingleMiddleware');
  });
});
