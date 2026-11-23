import http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import fs from "node:fs/promises";

export type Method = "get" | "post" | "put" | "patch" | "delete";

export interface ButterResponse extends ServerResponse {
  sendFile(path: string, mime: string): Promise<void>;
  status(code: number): ButterResponse;
  json(data: unknown): void;
}

export type Handler = (req: IncomingMessage, res: ButterResponse) => void;

export default class Butter {
  private server: http.Server;
  /**
   * {
   *  "get/": () => { ... },
   *  "post/upload": () => { ... }
   * }
   */
  private routes: Record<string, Handler> = {};

  constructor() {
    this.server = http.createServer();

    this.server.on("request", (req, rawRes) => {
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

      const key = (req.method ?? "").toLowerCase() + req.url;
      const handler = this.routes[key];

      // If the routes object does not have a key of req.method + req.url, return 404
      if (!handler) {
        return res
          .status(404)
          .json({ error: `Cannot ${req.method} ${req.url}` });
      }

      handler(req, res);
    });
  }

  route(method: Method, path: string, cb: Handler): void {
    this.routes[method + path] = cb;
  }

  listen(port: number, cb: () => void): void {
    this.server.listen(port, () => {
      cb();
    });
  }
}
