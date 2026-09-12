function productionErrorLog(err) {
  if (err && typeof err === "object" && "name" in err) {
    return { name: err.name };
  }

  return { name: "Error" };
}

export function errorHandler(err, req, res, next) {
  console.error(
    "Unhandled API error:",
    process.env.NODE_ENV === "production" ? productionErrorLog(err) : err
  );

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    success: false,
    message: "Unexpected server error"
  });
}
