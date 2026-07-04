export function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function fail(res, message, status = 400) {
  return res.status(status).json({ success: false, message });
}

export function methodNotAllowed(allowed) {
  return (req, res) => {
    res.setHeader("Allow", allowed);
    return fail(res, "Method not allowed", 405);
  };
}
