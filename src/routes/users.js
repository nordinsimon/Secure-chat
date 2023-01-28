//USER API
import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import * as dotenv from "dotenv";
import bcrypt from "bcryptjs";

//Creates links to database
const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, "../db/db_users.json");
const adapter = new JSONFile(file);
const db_users = new Low(adapter);

const file2 = join(__dirname, "../db/db_nextUuId.json");
const adapter2 = new JSONFile(file2);
const db_nextUuId = new Low(adapter2);
//

// Gets the salt from the dotenv file
dotenv.config();
const SALT = process.env.SALT;
//

const router = express.Router();

await db_users.read(), db_nextUuId.read();

router.get("/", (req, res) => {
  res.status(200).send(db_users.data);
});

router.get("/nextuuid/", (req, res) => {
  res.status(200).send(db_nextUuId.data);
});

router.post("/", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  if (
    correctUsernameInput(username) === false ||
    correctPasswordInput(password) === false ||
    usernameExists(username) !== false
  ) {
    res.sendStatus(400);
    return;
  }
  addUser(username, password);
  res.sendStatus(201);
});
function usernameExists(username) {
  let findUser = db_users.data.findIndex((user) => user.username === username);
  if (findUser >= 0) {
    return findUser;
  } else {
    return false;
  }
}
function correctUsernameInput(username) {
  if (username === undefined) {
    console.log("username is undefined");
    return false;
  } else {
    console.log("correctUsernameInput");
    return true;
  }
}
function correctPasswordInput(password) {
  if (password === undefined) {
    console.log("password is undefined");
    return false;
  } else {
    console.log("correctPasswordInput");
    return true;
  }
}
async function addUser(name, password) {
  let nextuuid = db_nextUuId.data.nextuuid++;
  let hashedPassword = bcrypt.hashSync(password, SALT);
  db_users.data.push({
    uuid: nextuuid,
    username: name,
    password: hashedPassword,
  });
  await db_nextUuId.write();
  await db_users.write();
}

export default router;
export { usernameExists, correctUsernameInput, correctPasswordInput };
