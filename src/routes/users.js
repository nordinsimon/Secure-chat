//USER API
import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, "../db.json");
const adapter = new JSONFile(file);
const db = new Low(adapter);

const router = express.Router();
await db.read();

/*
db.data[0] ----- nextuuid
db.data[1] ----- Users
db.data[2] ----- Chanels
*/

router.get("/", (req, res) => {
  res.status(200).send(db.data[1]);
});

router.post("/", (req, res) => {
  addUser(req.body.username, req.body.password);
  res.sendStatus(201);
});

async function addUser(name, password) {
  await db.read();
  let nextuuid = db.data[0][0].nextuuid++;
  db.data[1].push({
    uuid: nextuuid,
    username: name,
    password: password,
  });
  await db.write();
}
//addUser("Simon", "password_simon");

export default router;
