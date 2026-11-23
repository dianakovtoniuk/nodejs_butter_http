import Butter from "../butter";

interface User {
  id: number;
  name: string;
  username: string;
  password: string;
}

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
  author?: string;
}

const USERS: User[] = [
  { id: 1, name: "Liam Brown", username: "liam23", password: "string" },
  { id: 2, name: "Meredith Green", username: "merit.sky", password: "string" },
  { id: 3, name: "Ben Adams", username: "ben.poet", password: "string" },
];

const POSTS: Post[] = [
  {
    id: 1,
    title: "This is a post title",
    body: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.",
    userId: 1,
  },
];

const PORT = 8000;

const server = new Butter();

server.beforeEach((req, res, next) => {
  console.log("This is the first middleware function!");
  next();
});

server.beforeEach((req, res, next) => {
  setTimeout(() => {
    console.log("This is the second middleware function!");
    next();
  }, 2000);
});

server.beforeEach((req, res, next) => {
  console.log("This is the third middleware function!");
  next();
});

// ------ Files Routes ------ //

server.route("get", "/", (req, res) => {
  console.log("This is the / route!");

  res.sendFile("./public/index.html", "text/html");
});

server.route("get", "/styles.css", (req, res) => {
  res.sendFile("./public/styles.css", "text/css");
});

server.route("get", "/scripts.js", (req, res) => {
  res.sendFile("./public/scripts.js", "text/javascript");
});

// ------ JSON Routes ------ //

// Send the list of all the posts that we have
server.route("get", "/api/posts", (req, res) => {
  const posts = POSTS.map((post) => {
    const user = USERS.find((user) => user.id === post.userId);
    return { ...post, author: user?.name };
  });

  res.status(200).json(posts);
});

server.listen(PORT, () => {
  console.log(`Server has started on port ${PORT}`);
});
