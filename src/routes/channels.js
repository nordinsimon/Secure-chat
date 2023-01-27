//CHANEL API
import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

//Vet inte varför det paketet är importerat
//import { channel } from "diagnostics_channel";

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, "../db/db_users.json");
const adapter = new JSONFile(file);
const db_users = new Low(adapter);

const file2 = join(__dirname, "../db/db_channels.json");
const adapter2 = new JSONFile(file2);
const db_channels = new Low(adapter2);

const file3 = join(__dirname, "../db/db_nextmessageid.json");
const adapter3 = new JSONFile(file3);
const db_nextMessageId = new Low(adapter3);

const router = express.Router();
await db_users.read(), db_channels.read(), db_nextMessageId.read();

router.get("/", (req, res) => {
  res.status(200).send(db_channels.data);
});
router.get("/users/", (req, res) => {
  res.status(200).send(db_users.data);
});

router.post("/", (req, res) => {
  const channelName = req.body.chanel_name;
  const channelIndex = chanelExists(channelName);
  const uuid = req.body.uuid;
  const message = req.body.message;

  if (exists(channelName, uuid) === false) {
    res.sendStatus(400);
  }
  addMessageToChannel(channelIndex, uuid, message);
  res.status(201).send(db_channels.data);
});

router.put("/", (req, res) => {
  const channelName = req.body.chanel_name;
  const channelIndex = chanelExists(channelName);
  const uuid = req.body.uuid;
  const messageid = req.body.messageid;
  const newMessage = req.body.newMessage;

  if (
    exists(channelName, uuid) === false ||
    messageidExists(channelIndex, messageid) === false
  ) {
    res.sendStatus(400);
    return;
  }

  editMessage(channelIndex, messageid, uuid, newMessage);
  res.status(200).send(db_channels.data);
});

router.delete("/", (req, res) => {
  const channelName = req.body.chanel_name;
  const channelIndex = chanelExists(channelName);
  const uuid = req.body.uuid;
  const messageid = req.body.messageid;

  if (
    exists(channelName, uuid) === false ||
    messageidExists(channelIndex, messageid) === false
  ) {
    res.sendStatus(400);
    return;
  }

  deleteMessage(channelIndex, messageid, uuid);
  res.status(200).send(db_channels.data);
});

//
//
//
//
//
function chanelExists(channelname) {
  let findChanel = db_channels.data.findIndex(
    (channel) => channel.chanel_name === channelname
  );
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
function messageidExists(channelIndex, messageid) {
  let chatIndex = db_channels.data[channelIndex].chat.findIndex(
    (chat) => chat.messageid === messageid
  );
  if (chatIndex >= 0) {
    return chatIndex;
  } else {
    console.log("Messageid does not exists");
    return false;
  }
}
function exists(channelName, uuid) {
  if (chanelExists(channelName) === false) {
    console.log("Chanel does not exists");
    return false;
  } else if (userExists(uuid) === false) {
    console.log("User does not exists");
    return false;
  }
  return true;
}

async function addMessageToChannel(channelIndex, uuid, message) {
  let nextMessageID = db_nextMessageId.data.nextmessageid++;
  db_channels.data[channelIndex].chat.push({
    messageid: nextMessageID,
    uuid: uuid,
    message: message,
    timestamp: new Date(),
  });
  await db_channels.write(), db_nextMessageId.write();
}
async function editMessage(channelIndex, messageid, uuid, newmessage) {
  const chatIndex = messageidExists(channelIndex, messageid);

  const db = db_channels.data[channelIndex].chat[chatIndex];
  db.message = newmessage;
  db.ischanged = "yes";
  db.changedtime = new Date();

  await db_channels.write();
}
async function deleteMessage(channelIndex, messageid, uuid) {
  const chatIndex = messageidExists(channelIndex, messageid);

  const db = db_channels.data[channelIndex].chat[chatIndex];
  db.message = "Message DELETED";
  db.isdeleted = "yes";
  db.deletedtime = new Date();

  await db_channels.write();
}

//
export default router;
