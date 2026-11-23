import http from "node:http";

interface CreatePostBody {
  title: string;
  body: string;
}

const server = http.createServer();

server.on("request", (request, response) => {
  console.log("--------- METHOD: ---------");
  console.log(request.method);

  console.log("--------- URL: ---------");
  console.log(request.url);

  console.log("--------- HEADERS: ---------");
  console.log(request.headers);

  const name = request.headers.name;

  console.log("--------- BODY: ---------");

  let raw = "";

  request.on("data", (chunk: Buffer) => {
    raw += chunk.toString();
    console.log(raw);
  });

  request.on("end", () => {
    const data: CreatePostBody = JSON.parse(raw);

    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        message: `Post with title ${data.title} was created by ${name}`,
      })
    );
  });
});

server.listen(8050, () => {
  console.log("Server listening on http://localhost:8050");
});
