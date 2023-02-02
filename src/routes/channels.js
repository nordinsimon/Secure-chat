//CHANNEL API
import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { decodeToken } from "./login.js";

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

const file4 = join(__dirname, "../db/db_nextchannelid.json");
const adapter4 = new JSONFile(file4);
const db_nextChannelId = new Low(adapter4);

const router = express.Router();
await updateDataFromAllDB();

router.get("/", async (req, res) => {
  await updateDataFromAllDB();
  const allChannels = [];
  db_channels.data.forEach((channel) => {
    const object = {
      channel_name: channel.channel_name,
      secure_status: channel.secure_status,
      channelid: channel.channelid,
    };
    allChannels.push(object);
  });
  res.status(200).send(allChannels);
});

router.get("/:channelid", (req, res) => {
  const channelId = req.params.channelid;
  const jwt = req.headers["authorization"];

  console.log("jwt", jwt);
  console.log(channelId);

  if (
    correctChannelId(channelId) === false ||
    channelExistsID(channelId) === false
  ) {
    res.sendStatus(400);
    return;
  }
  const channelIndex = channelExistsID(channelId);
  if (db_channels.data[channelIndex].secure_status === "public") {
    res.status(200).send(db_channels.data[channelIndex].chat);
    return;
  }
  if (decodeToken(jwt) === false) {
    res.sendStatus(401);
    return;
  }
  res.status(200).send(db_channels.data[channelIndex].chat);
});

router.post("/", async (req, res) => {
  await db_channels.read(), db_users.read();
  const channelId = req.body.channelId;
  const channelIndex = await channelExistsID(channelId);
  const uuid = req.body.uuid;
  const message = req.body.message;
  const timestamp = req.body.timestamp;

  if (
    correctChannelId(channelId) === false ||
    correctUuidInput(uuid) === false ||
    correctMessageInput(message) == false ||
    channelIndex === false ||
    (await userExists(uuid)) === false
  ) {
    res.sendStatus(400);
    return;
  }

  addMessageToChannel(channelIndex, uuid, message, timestamp);
  res.sendStatus(201);
});

router.put("/", (req, res) => {
  const channelName = req.body.channel_name;
  const uuid = req.body.uuid;
  const messageid = req.body.messageid;
  const newMessage = req.body.newMessage;

  if (
    correctChannelInput(channelName) === false ||
    correctUuidInput(uuid) === false ||
    correctMessageIdInput(messageid) === false ||
    correctNewMessageInput(newMessage) === false ||
    channelExists(channelName) === false ||
    userExists(uuid) === false
  ) {
    res.sendStatus(400);
    return;
  }
  const channelIndex = channelExists(channelName);
  if (messageidExists(channelIndex, messageid) === false) {
    res.sendStatus(400);
    return;
  }
  const chatIndex = messageidExists(channelIndex, messageid);
  if (isUuidEqual(channelIndex, chatIndex, uuid) === false) {
    res.sendStatus(401);
    return;
  }

  editMessage(channelIndex, chatIndex, uuid, newMessage);
  res.status(200).send(db_channels.data);
});

router.delete("/", (req, res) => {
  const channelName = req.body.channel_name;
  const uuid = req.body.uuid;
  const messageid = req.body.messageid;

  if (
    correctChannelInput(channelName) === false ||
    correctUuidInput(uuid) === false ||
    correctMessageIdInput(messageid) === false ||
    channelExists(channelName) === false ||
    userExists(uuid) === false
  ) {
    res.sendStatus(400);
    return;
  }
  const channelIndex = channelExists(channelName);
  if (messageidExists(channelIndex, messageid) === false) {
    res.sendStatus(400);
    return;
  }
  const chatIndex = messageidExists(channelIndex, messageid);
  if (isUuidEqual(channelIndex, chatIndex, uuid) === false) {
    res.sendStatus(401);
    return;
  }

  deleteMessage(channelIndex, chatIndex, messageid, uuid);
  res.status(200).send(db_channels.data);
});

router.post("/newchannel/", (req, res) => {
  const newChannelName = req.body.new_channel_name;
  const secureStatus = req.body.secure_status;

  if (
    correctNewChannelName(newChannelName) === false ||
    correctSecureStatusInput(secureStatus) === false ||
    isValidSecureChatStatus(secureStatus) === false ||
    channelExists(newChannelName) !== false
  ) {
    res.sendStatus(400);
  } else {
    addNewChannel(newChannelName, secureStatus);
    res.status(201).send(db_channels.data);
  }
});

//
//
//
// FUNCTIONS :)))
//
//
//
function channelExists(channelname) {
  let findchannel = db_channels.data.findIndex(
    (channel) => channel.channel_name === channelname
  );
  if (findchannel >= 0) {
    console.log("channelExists");
    return findchannel;
  } else {
    return false;
  }
}
function channelExistsID(channelid) {
  let findchannel = db_channels.data.findIndex(
    (channel) => channel.channelid === Number(channelid)
  );
  if (findchannel >= 0) {
    console.log("channelExists");
    return findchannel;
  } else {
    console.log("Channel not exist");
    return false;
  }
}
function messageidExists(channelIndex, messageid) {
  let chatIndex = db_channels.data[channelIndex].chat.findIndex(
    (chat) => chat.messageid === messageid
  );
  if (chatIndex >= 0) {
    console.log("messageidExists");
    return chatIndex;
  } else {
    console.log("Messageid does not exists");
    return false;
  }
}
function correctChannelInput(channelName) {
  if (channelName === undefined) {
    console.log("Channel is undefined");
    return false;
  } else {
    console.log("correctChannelInput");
    return true;
  }
}
function correctUuidInput(uuid) {
  if (uuid === undefined) {
    console.log("uuid is undefined");
    return false;
  } else {
    console.log("correctUuidInput");
    return true;
  }
}
function correctMessageIdInput(messageid) {
  if (messageid === undefined) {
    console.log("messageid is undefined");
    return false;
  } else {
    console.log("correctMessageIdInput");
    return true;
  }
}
function correctMessageInput(message) {
  if (message === undefined) {
    console.log("Message is undefined");
    return false;
  } else {
    console.log("correctMessageInput");
    return true;
  }
}
function correctNewMessageInput(newMessage) {
  if (newMessage === undefined) {
    console.log("NewMessage is undefined");
    return false;
  } else {
    console.log("correctNewMessageInput");
    return true;
  }
}
function correctNewChannelName(newChannelName) {
  if (newChannelName === undefined) {
    console.log("newChannelName is undefined");
    return false;
  } else {
    console.log("correctNewChannelName");
    return true;
  }
}
function correctChannelId(channelId) {
  if (channelId === undefined) {
    console.log("ChannelId is undefined");
    return false;
  } else {
    console.log("correctChannelId");
    return true;
  }
}
function correctSecureStatusInput(status) {
  if (status === undefined) {
    console.log("Secure status is undefined");
    return false;
  } else {
    console.log("correctSecureStatusInput");
    return true;
  }
}
function isUuidEqual(channelIndex, chatIndex, uuid) {
  let uuidOnMessage = db_channels.data[channelIndex].chat[chatIndex].uuid;
  console.log("uuidOnMessage", uuidOnMessage);
  if (uuidOnMessage !== uuid) {
    console.log("uuid is not equal");
    return false;
  } else {
    return true;
  }
}
function isValidSecureChatStatus(status) {
  if (status === "public" || status === "private") {
    console.log("isValidSecureChatStatus");
    return true;
  }
  console.log("Secure status incorrect value");
  return false;
}
async function userExists(uuid) {
  db_users.read;
  let findUser = await db_users.data.findIndex((user) => user.uuid === uuid);
  if (findUser >= 0) {
    console.log("uuidExists");
    return findUser;
  } else {
    console.log("User does not exists");
    return false;
  }
}
async function updateDataFromAllDB() {
  await db_users.read(),
    db_channels.read(),
    db_nextMessageId.read(),
    db_nextChannelId.read();
}
async function addMessageToChannel(channelIndex, uuid, message, timestamp) {
  let nextMessageID = db_nextMessageId.data.nextmessageid++;
  db_channels.data[channelIndex].chat.push({
    messageid: nextMessageID,
    uuid: uuid,
    message: message,
    timestamp: timestamp,
  });
  await db_channels.write(), db_nextMessageId.write();
}
async function editMessage(channelIndex, chatIndex, uuid, newmessage) {
  const db = db_channels.data[channelIndex].chat[chatIndex];
  db.message = newmessage;
  db.ischanged = "yes";
  db.changedtime = new Date();

  await db_channels.write();
}
async function deleteMessage(channelIndex, chatIndex, uuid) {
  const db = db_channels.data[channelIndex].chat[chatIndex];
  db.message = "Message DELETED";
  db.isdeleted = "yes";
  db.deletedtime = new Date();

  await db_channels.write();
}
async function addNewChannel(chanelName, secureStatus) {
  let nextchannelID = db_nextChannelId.data.nextchannelid++;
  console.log(nextchannelID);
  db_channels.data.push({
    channel_name: chanelName,
    secure_status: secureStatus,
    channelid: nextchannelID,
    chat: [],
  });
  await db_channels.write();
  await db_nextChannelId.write();
}

//
export default router;
