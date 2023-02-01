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

await db_users.read();

router.post("/", async (req, res) => {
  await db_users.read();
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

router.post("/JWT", async (req, res) => {
  await db_users.read();
  // JWT kan skickas antingen i request body, med querystring, eller i header: Authorization
  let token = req.body.token || req.query.token;
  if (!token) {
    let x = req.headers["authorization"];
    if (x === undefined) {
      // Vi hittade ingen token, authorization fail
      res.sendStatus(401);
      return;
    }
    token = x.substring(7);
  }

  console.log("Token: ", token);
  if (token) {
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET);
    } catch (error) {
      console.log("Catch! Felaktig token!!");
      res.sendStatus(401);
      return;
    }
    console.log("decoded: ", decoded);
    res.status(200).send(decoded);
  } else {
    console.log("Ingen token");
    res.sendStatus(401); // Unauthorized
  }
});

function createToken(name) {
  const user = { name: name };
  const token = jwt.sign(user, process.env.SECRET, {
    expiresIn: process.env.JWTTIME,
  });
  user.token = token;
  return user;
}

export default router;
