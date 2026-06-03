import { ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";

function asyncHandler(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

export const getMessages = asyncHandler(async (req, res) => {
  return ok(res, await listMessages());
});

export const postMessage = asyncHandler(async (req, res) => {
  return ok(res, await sendMessage(req.body), 201);
});
