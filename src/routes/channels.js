//CHANEL API
import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { channel } from "diagnostics_channel";
import e from "express";

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

router.post("/", (req, res) => {
  const channelName = req.body.chanel_name;
  const uuid = req.body.uuid;
  const message = req.body.message;
  //returns the index if it exists and if not retruns false
  const channelIndex = chanelExists(channelName);

  if (channelIndex === false) {
    console.log("Chanel does not exists");
    res.sendStatus(400);
    return;
  } else if (userExists(uuid) === false) {
    console.log("User does not exists");
    res.sendStatus(400);
    return;
  }

  addMessageToChannel(channelIndex, uuid, message);
  res.status(201).send(db_channels.data);
});

async function addMessageToChannel(channelIndex, uuid, message) {
  console.log("chanelindex", channelIndex);
  console.log(db_channels.data[channelIndex]);
  db_channels.data[channelIndex].chat.push({
    uuid: uuid,
    message: message,
    timestamp: new Date(),
  });
  await db_channels.write();
}

function chanelExists(channelname) {
  let findChanel = db_channels.data.findIndex(
    (channel) => channel.chanel_name === channelname
  );
  console.log("fimdchanel", findChanel);
  if (findChanel >= 0) {
    return findChanel;
  } else {
    return false;
  }
}
function userExists(uuid) {
  let findUser = db_users.data.findIndex((user) => user.uuid === uuid);
  if (findUser >= 0) {
    return findUser;
  } else {
    return false;
  }
}

export default router;
