import { Readable, Writable } from "node:stream";

export function request(app, { body, headers = {}, method = "GET", path }) {
  const payload = body === undefined ? "" : JSON.stringify(body);
  const req = Readable.from(payload ? [payload] : []);
  const socket = { encrypted: false, remoteAddress: "127.0.0.1" };

  req.method = method;
  req.url = path;
  req.headers = {
    ...headers,
    ...(payload
      ? {
          "content-length": Buffer.byteLength(payload),
          "content-type": "application/json"
        }
      : {})
  };
  req.socket = socket;
  req.connection = socket;

  const chunks = [];
  const responseHeaders = {};
  const res = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(Buffer.from(chunk, encoding));
      callback();
    }
  });

  res.statusCode = 200;
  res.locals = {};
  res.setHeader = (name, value) => {
    responseHeaders[name.toLowerCase()] = value;
  };
  res.getHeader = (name) => responseHeaders[name.toLowerCase()];
  res.getHeaders = () => ({ ...responseHeaders });
  res.removeHeader = (name) => {
    delete responseHeaders[name.toLowerCase()];
  };
  res.writeHead = (statusCode, statusMessage, headersToWrite) => {
    res.statusCode = statusCode;
    const headers = typeof statusMessage === "object" ? statusMessage : headersToWrite;
    if (headers) {
      Object.entries(headers).forEach(([name, value]) => res.setHeader(name, value));
    }
    return res;
  };

  const originalEnd = res.end.bind(res);
  res.end = (chunk, encoding, callback) => {
    if (chunk) {
      chunks.push(Buffer.from(chunk, typeof encoding === "string" ? encoding : undefined));
    }
    return originalEnd(typeof encoding === "function" ? encoding : callback);
  };

  return new Promise((resolve, reject) => {
    res.on("finish", () => {
      const text = Buffer.concat(chunks).toString("utf8");
      resolve({
        headers: responseHeaders,
        json: () => JSON.parse(text),
        status: res.statusCode,
        text
      });
    });

    app.handle(req, res, (error) => {
      if (error) {
        reject(error);
      }
    });
  });
}
