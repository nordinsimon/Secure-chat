import express from "express";
import * as url from "url";
import usersRoute from "./routes/users.js";
import channelsRoute from "./routes/channels.js";

// Konfiguration
const app = express();

const staticPath = url.fileURLToPath(new URL("../static", import.meta.url));

// Middleware
const logger = (req, res, next) => {
  console.log(`${req.method}  ${req.url}`, req.body);
  next();
};

app.use(express.json());
app.use(logger);
app.use(express.static(staticPath));

// Routes
app.use("/api/users/", usersRoute);
app.use("/api/channels/", channelsRoute);

app.get("/", (req, res) => {
  let path = staticPath + "/index.html";
  res.sendFile(path);
});

export { app };
