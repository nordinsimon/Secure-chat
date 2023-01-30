import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import * as dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  usernameExists,
  correctUsernameInput,
  correctPasswordInput,
} from "./users.js";

//Creates links to database
const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, "../db/db_users.json");
const adapter = new JSONFile(file);
const db_users = new Low(adapter);

dotenv.config();
const SALT = process.env.SALT;
//

const router = express.Router();

router.post("/", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  let hashedPassword = bcrypt.hashSync(password, SALT);
  if (
    correctUsernameInput(username) === false ||
    correctPasswordInput(password) === false ||
    usernameExists(username) === false
  ) {
    console.log("Somethning wrong with login");
    res.sendStatus(401);
    return;
  }
  const userIndex = usernameExists(username);

  if (db_users.data[userIndex].password !== hashedPassword) {
    console.log("Password wrong");
    res.sendStatus(401);
    return;
  }
  const userToken = createToken(username);
  res.status(200).send(userToken);
});

function createToken(name) {
  const user = { name: name };
  const token = jwt.sign(user, process.env.SECRET, { expiresIn: "1h" });
  user.token = token;
  console.log("createToken", user);
  return user;
}
await db_users.read();

export default router;