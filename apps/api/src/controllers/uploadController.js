const { uploadFile, deleteFile } = require('../services/uploadService');
const sanitizeFilename = require('../utils/sanitizeFilename');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Handles file upload requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadFileHandler = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }

    // Sanitize the original filename before returning it
    const sanitizedFilename = sanitizeFilename(req.file.originalname);
    
    const fileData = {
      id: req.file.id,
      filename: sanitizedFilename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: req.file.url,
    };

    return successResponse(res, 'File uploaded successfully', fileData, 201);
  } catch (error) {
    console.error('File upload error:', error);
    return errorResponse(res, 'Failed to upload file', 500);
  }
};

/**
 * Handles file deletion requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteFileHandler = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const result = await deleteFile(fileId);
    
    if (!result.success) {
      return errorResponse(res, result.message, 404);
    }

    return successResponse(res, 'File deleted successfully');
  } catch (error) {
    console.error('File deletion error:', error);
    return errorResponse(res, 'Failed to delete file', 500);
  }
};

module.exports = {
  uploadFileHandler,
  deleteFileHandler,
};