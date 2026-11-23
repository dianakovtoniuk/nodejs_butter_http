# Nodejs Http From Scratch

Exploring how HTTP works in Node.js without Express, from raw TCP sockets up to a small Express-like framework with middleware, cookie-based login and a round-robin reverse proxy. Written in TypeScript with zero runtime dependencies.

## Structure

```
http/
├── net-server.ts      # raw TCP server replying with a hand-built HTTP response (hex)
├── net-sender.ts      # raw TCP client sending a hand-built POST request (hex)
├── simple-server.ts   # node:http server that parses a JSON body
├── simple-client.ts   # node:http client with a keep-alive agent
├── butter.ts          # minimal Express-like framework (routing, middleware, res helpers)
├── simple-web/        # static site served with Butter, plus a plain-http version for comparison
├── poster/            # posts API with login and token sessions, built on Butter
└── poster-proxy/      # reverse proxy balancing requests between two backend servers
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
| `npm run poster` | posts API with login | 8000 |
| `npm run poster-proxy:1` | backend server 1 | 9001 |
| `npm run poster-proxy:2` | backend server 2 | 9002 |
| `npm run poster-proxy:proxy` | reverse proxy | 9000 |
| `npm run typecheck` | type check only | |

Try the client and server together:

```bash
npm run simple-server
npm run simple-client
```

Try the proxy (three terminals):

```bash
npm run poster-proxy:1
npm run poster-proxy:2
npm run poster-proxy:proxy
```

Then open `http://localhost:9000` and refresh a few times. The backend logs alternate between server 1 and server 2.

## Butter

```ts
import Butter from "./butter";

const app = new Butter();

// Runs before every route, in registration order
app.beforeEach((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

app.route("get", "/api/hello", (req, res) => {
  res.status(200).json({ message: "Hello" });
});

app.listen(3000, () => console.log("Listening on 3000"));
```

Routes are matched on `method + url`. Middleware functions run one after another, and each must call `next()` to continue. Unknown routes return a 404 JSON error after the middleware has run.

## Poster

| Route | Description |
| --- | --- |
| `GET /`, `/login`, `/profile` | serve `index.html` |
| `GET /styles.css`, `/scripts.js` | static files |
| `POST /api/login` | checks credentials, sets a `token` cookie |
| `GET /api/user` | returns the user for the token cookie, 401 otherwise |
| `GET /api/posts` | list of posts with the author name attached |
| `DELETE /api/logout`, `PUT /api/user`, `POST /api/posts` | stubs, not implemented yet |

Demo users live in memory in `server.ts`. The server also registers three demo middleware functions, one of which waits 2 seconds, so every request is delayed accordingly.

The static frontend for `poster` and `poster-proxy` (`index.html`, `styles.css`, `scripts.js`) is not included in this repo. Place those files in the matching `public/` folder to serve the page at `/`.

## Known limitations

- Query strings are not supported: `/api/posts?x=1` returns 404.
- `res.sendFile` does not handle missing files, so requesting a page without its frontend files crashes the server.
- Sessions are stored in memory in a single process, so they would not work behind the proxy with several copies of `poster`.
- Passwords are stored in plain text. This is demo data only.
- Stub routes never respond, so the request hangs.
- Static file paths are relative to the working directory, so run the servers through the npm scripts.
````
