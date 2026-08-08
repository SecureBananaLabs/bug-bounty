import { registerAuthenticatedUploadRoute } from '../routes/authenticatedUploadRoutes';

describe('Authenticated Upload Route Security', () => {
  it('should register authMiddleware before upload processing', () => {
    const router = { post: jest.fn() };
    const authMiddleware = jest.fn();
    const uploadMiddleware = { single: jest.fn().mockReturnValue('multerMiddleware') };
    const uploadFileController = jest.fn();

    registerAuthenticatedUploadRoute(router, authMiddleware, uploadMiddleware, uploadFileController);

    expect(router.post).toHaveBeenCalledWith("/", authMiddleware, "multerMiddleware", uploadFileController);
  });
});
