export function parseRequestPayload(schema, body, res) {
  const result = schema.safeParse(body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      message: "Invalid request payload",
      issues: result.error.issues
    });
    return null;
  }

  return result.data;
}
