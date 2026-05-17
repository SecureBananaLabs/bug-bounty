import { ok } from "../utils/response.js";
import { listMessages, sendMessage } from "../services/messageService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getMessages = asyncHandler(async (req, res) => {
  return ok(res, await listMessages());
});

export const postMessage = asyncHandler(async (req, res) => {
  return ok(res, await sendMessage(req.body), 201);
});
