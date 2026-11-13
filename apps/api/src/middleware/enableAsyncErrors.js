import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const Layer = require("express/lib/router/layer");

if (!Layer.prototype.__asyncErrorsPatched) {
  Layer.prototype.__asyncErrorsPatched = true;
  const originalHandleRequest = Layer.prototype.handle_request;

  Layer.prototype.handle_request = function handleRequest(req, res, next) {
    const fn = this.handle;

    if (fn.length > 3) {
      return originalHandleRequest.call(this, req, res, next);
    }

    try {
      const result = fn(req, res, next);
      if (result && typeof result.then === "function") {
        return Promise.resolve(result).catch(next);
      }
      return result;
    } catch (error) {
      return next(error);
    }
  };
}
