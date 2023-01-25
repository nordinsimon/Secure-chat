//USER API
import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, "../db/db_users.json");
const adapter = new JSONFile(file);
const db_users = new Low(adapter);

const file2 = join(__dirname, "../db/db_nextUuId.json");
const adapter2 = new JSONFile(file2);
const db_nextUuId = new Low(adapter2);

const router = express.Router();

await db_users.read();

router.get("/", (req, res) => {
  res.status(200).send(db_users.data);
});

router.post("/", (req, res) => {
  addUser(req.body.username, req.body.password);
  res.sendStatus(201);
});

async function addUser(name, password) {
  await db_nextUuId.read();
  let nextuuid = db_nextUuId.data.nextuuid++;
  console.log("nextuuid", nextuuid);
  db_users.data.push({
    uuid: nextuuid,
    username: name,
    password: password,
  });
  await db_nextUuId.write();
  await db_users.write();
}

export default router;
