import { signAccessToken } from "./jwt.js";

console.log(signAccessToken({ sub: "admin_demo", role: "admin" }));
