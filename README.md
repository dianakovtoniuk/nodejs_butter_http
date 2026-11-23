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
├── poster/            # posts API with login, sessions and auth middleware, built on Butter
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

Routes are matched on `method + url`. Middleware functions run one after another, and each must call `next()` to continue or respond itself to stop the chain. Unknown routes return a 404 JSON error after the middleware has run.

`req` is a `ButterRequest`: a regular `IncomingMessage` with two optional fields that middleware can fill in, `userId` and `body`.

## Poster

| Route | Auth | Description |
| --- | --- | --- |
| `GET /`, `/login`, `/profile`, `/new-post` | no | serve `index.html` |
| `GET /styles.css`, `/scripts.js` | no | static files |
| `POST /api/login` | no | checks credentials, sets a `token` cookie |
| `DELETE /api/logout` | yes | removes the session and clears the cookie |
| `GET /api/user` | yes | returns the username and name of the current user |
| `PUT /api/user` | yes | updates username, name and, optionally, password |
| `GET /api/posts` | no | list of posts with the author name attached |
| `POST /api/posts` | yes | creates a post and returns it with status 201 |

Three middleware functions run before the routes:

1. Authentication: for protected routes, looks up the `token` cookie in `SESSIONS`, sets `req.userId` or responds with 401.
2. JSON parsing: parses bodies sent with `Content-Type: application/json` into `req.body`.
3. Page routing: serves `index.html` for the frontend routes.

Demo users and posts live in memory in `server.ts` and reset on every restart.

The static frontend for `poster` and `poster-proxy` (`index.html`, `styles.css`, `scripts.js`) is not included in this repo. Place those files in the matching `public/` folder to serve the page at `/`.

Quick check with curl:

```bash
curl -i -X POST -H "Content-Type: application/json" \
  -d '{"username":"liam23","password":"string"}' \
  http://localhost:8000/api/login

curl -b "token=<token from Set-Cookie>" http://localhost:8000/api/user
```

## Known limitations

- Query strings are not supported: `/api/posts?x=1` returns 404.
- `res.sendFile` does not handle missing files, so requesting a page without its frontend files crashes the server.
- Invalid or missing JSON bodies on routes that expect one are not handled and crash the request.
- The token is read as the first value of the `Cookie` header, so it only works when `token` is the only cookie.
- Sessions are stored in memory in a single process, so they would not work behind the proxy with several copies of `poster`.
- Passwords are stored in plain text. This is demo data only.
- Static file paths are relative to the working directory, so run the servers through the npm scripts.
