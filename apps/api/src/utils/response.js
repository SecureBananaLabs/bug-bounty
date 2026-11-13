export function ok(res, data) {
  return res.status(200).json(data);
}

export function created(res, data) {
  return res.status(201).json(data);
}

export function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

export function forbidden(res, message) {
  return res.status(403).json({ error: message });
}
