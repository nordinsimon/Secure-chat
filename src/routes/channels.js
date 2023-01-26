//CHANEL API
import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, "../db/db_users.json");
const adapter = new JSONFile(file);
const db_users = new Low(adapter);

const file2 = join(__dirname, "../db/db_channels.json");
const adapter2 = new JSONFile(file2);
const db_channels = new Low(adapter2);

const router = express.Router();
await db_users.read(), db_channels.read();

router.get("/", (req, res) => {
  res.status(200).send(db_channels.data);
});
router.get("/users/", (req, res) => {
  res.status(200).send(db_users.data);
});

export default router;
