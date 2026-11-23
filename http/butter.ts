import http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import fs from "node:fs/promises";

export type Method = "get" | "post" | "put" | "patch" | "delete";

export interface ButterRequest extends IncomingMessage {
  // Set by the authentication middleware
  userId?: number;
  // Set by the JSON-parsing middleware
  body?: unknown;
}

export interface ButterResponse extends ServerResponse {
  sendFile(path: string, mime: string): Promise<void>;
  status(code: number): ButterResponse;
  json(data: unknown): void;
}

export type Handler = (req: ButterRequest, res: ButterResponse) => void;

export type Middleware = (
  req: ButterRequest,
  res: ButterResponse,
  next: () => void
) => void;

export default class Butter {
  private server: http.Server;
  /**
   * {
   *  "get/": () => { ... },
   *  "post/upload": () => { ... }
   * }
   */
  private routes: Record<string, Handler> = {};
  private middleware: Middleware[] = [];

  constructor() {
    this.server = http.createServer();

    this.server.on("request", (rawReq, rawRes) => {
      const req = rawReq as ButterRequest;
      const res = rawRes as ButterResponse;

      // Send a file back to the client
      res.sendFile = async (path: string, mime: string) => {
        const fileHandle = await fs.open(path, "r");
        const fileStream = fileHandle.createReadStream();

        res.setHeader("Content-Type", mime);

        fileStream.pipe(res);
      };

      // Set the status code of the response
      res.status = (code: number) => {
        res.statusCode = code;
        return res;
      };

      // Send a json data back to the client (for small json data, less than the highWaterMark)
      res.json = (data: unknown) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(data));
      };

      // Run all the middleware functions before we run the corresponding route
      const runMiddleware = (index: number): void => {
        // Our exit point...
        if (index === this.middleware.length) {
          const handler = this.routes[(req.method ?? "").toLowerCase() + req.url];

          // If the routes object does not have a key of req.method + req.url, return 404
          if (!handler) {
            res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
            return;
          }

          handler(req, res);
        } else {
          this.middleware[index](req, res, () => {
            runMiddleware(index + 1);
          });
        }
      };

      runMiddleware(0);
    });
  }

  route(method: Method, path: string, cb: Handler): void {
    this.routes[method + path] = cb;
  }

  // Register a function that runs before every request reaches its route
  beforeEach(cb: Middleware): void {
    this.middleware.push(cb);
  }

  listen(port: number, cb: () => void): void {
    this.server.listen(port, () => {
      cb();
    });
  }
}
