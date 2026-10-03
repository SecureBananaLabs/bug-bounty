<content>
const errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    // Handle malformed JSON bodies specifically
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON request body',
    });
  }

  // For all other errors, use the existing 500 handler
  res.status(500).json({
    success: false,
    message: 'Unexpected server error',
  });
};

module.exports = errorHandler;
</content>