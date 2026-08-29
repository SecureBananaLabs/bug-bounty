import crypto from "crypto";

export function csrfToken(req, res, next) {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie("csrf-token", token, {
    httpOnly: false,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  next();
}
