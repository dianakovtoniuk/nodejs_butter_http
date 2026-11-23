# Nodejs Http From Scratch

Exploring how HTTP works in Node.js without Express, going from raw TCP sockets up to a small Express-like framework. Written in TypeScript with zero runtime dependencies.

## Structure

```
http/
├── net-server.ts      # raw TCP server replying with a hand-built HTTP response (hex)
├── net-sender.ts      # raw TCP client sending a hand-built POST request (hex)
├── simple-server.ts   # node:http server that parses a JSON body
├── simple-client.ts   # node:http client with a keep-alive agent
├── butter.ts          # minimal Express-like framework (routing, res.json, res.status, res.sendFile)
├── simple-web/        # static site served with Butter, plus a plain-http version for comparison
└── poster/            # posts API built on Butter
```

## Getting started

Requires Node.js 18+.

```bash
npm install
```

| Command | What it runs | Port |
| --- | --- | --- |
| `npm run net-server` | raw TCP server | 8000 |
| `npm run net-sender` | raw TCP client (targets `simple-server`) | 8050 |
| `npm run simple-server` | HTTP server | 8050 |
| `npm run simple-client` | HTTP client | 8050 |
| `npm run simple-web` | static site on Butter | 4060 |
| `npm run simple-web:legacy` | same site on plain `http` | 9000 |
| `npm run poster` | posts API | 8000 |
| `npm run typecheck` | type check only | |

Try the client and server together:

```bash
npm run simple-server
npm run simple-client
```

## Butter

```ts
import Butter from "./butter";

const app = new Butter();

app.route("get", "/api/hello", (req, res) => {
  res.status(200).json({ message: "Hello" });
});

app.listen(3000, () => console.log("Listening on 3000"));
```

Routes are matched on `method + url`. Unknown routes return a 404 JSON error.

## Poster

`GET /api/posts` returns the list of posts with the author name attached.

The static frontend for `poster` (`index.html`, `styles.css`, `scripts.js`) is not included in this repo. Place those files in `http/poster/public/` to serve the page at `/`.

## Known limitations

- Query strings are not supported: `/api/posts?x=1` returns 404.
- `res.sendFile` does not handle missing files.
- Static file paths are relative to the working directory, so run `simple-web` and `poster` through the npm scripts.
