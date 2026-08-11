export function handleFileUploadRequest(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "File is required"
    });
  }

  return res.status(201).json({
    success: true,
    status: "uploaded",
    filename: req.file.filename || req.file.originalname
  });
}
