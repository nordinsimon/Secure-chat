const inputauthUsername = document.querySelector("#auth-username");
const inputauthPassword = document.querySelector("#auth-password");
const authsigninButton = document.querySelector("#auth-signin");

const chatMessageList = document.querySelector("#chat-messege-list");

const inputNewMessage = document.querySelector("#input-new-message");
const newMessageButton = document.querySelector("#new-message-button");

const publicChat = document.querySelector("#public-chat");
const privateChat = document.querySelector("#private-chat");

const selectedChannel = document.querySelector("#selected-channel");

//
//
// Webbsidan laddas
//
//

const JWT_KEY = "login-jwt";
let isLoggedIn = false;
let loggedinUser = "";
let loggedinUuid;
let activeChannel = "Public";
let uuidToUsers = [];

const loadJWT = getJWT();

updateUuidToUsername();
updateChatMessages(activeChannel);
checkIfJWTMatch(loadJWT);

authsigninButton.addEventListener("click", signIn);
inputauthPassword.addEventListener("keyup", (e) => {
  if (e.key === "Enter" && authsigninButton.disabled === false) {
    signIn();
  }
  authsigninButton.disabled = isInputFieldNotEmpty(inputauthPassword);
});
newMessageButton.addEventListener("click", addNewMessage);
inputNewMessage.addEventListener("keyup", (e) => {
  //If enter is pressed send new message to chat
  if (e.key === "Enter" && newMessageButton.disabled === false) {
    addNewMessage();
  }
  // Checks if input feeld is empy or not and set new message button disabled
  let isItOkToSendMessage =
    isInputFieldNotEmpty(inputNewMessage) || !isLoggedIn;
  newMessageButton.disabled = isItOkToSendMessage;
});

publicChat.addEventListener("click", () => {
  activeChannel = "Public";
  updateChatMessages(activeChannel);
});
privateChat.addEventListener("click", () => {
  if (isLoggedIn === false) return;
  activeChannel = "Private";
  updateChatMessages(activeChannel);
});
updateScroll();

//
//
// FUNCTIONS
//
//
async function checkIfJWTMatch(loadJWT) {
  const jwtObject = {
    token: loadJWT,
  };
  const options = {
    method: "POST",
    body: JSON.stringify(jwtObject),
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = await fetch("/api/login/JWT", options);
  if (response.status === 200) {
    let userFromJWT = await response.json();
    loggedinUser = userFromJWT.name;
    isLoggedIn = true;
    inputNewMessage.placeholder = "New message...";
    inputNewMessage.disabled = false;
    console.log("JWT Matched");
    return;
  }
}
async function signIn() {
  const user = {
    username: inputauthUsername.value,
    password: inputauthPassword.value,
  };
  const options = {
    method: "POST",
    body: JSON.stringify(user),
    headers: {
      "Content-Type": "application/json",
    },
  };
  const response = await fetch("/api/login/", options);
  if (response.status === 200) {
    const userToken = await response.json();

    localStorage.setItem(JWT_KEY, userToken.token);
    isLoggedIn = true;
    loggedinUser = inputauthUsername.value;
    inputNewMessage.placeholder = "New message...";
    inputNewMessage.disabled = false;
    inputauthUsername.value = "";
  }
  inputauthPassword.value = "";
}
async function updateUuidToUsername() {
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };
  const response = await fetch("/api/users/", options);
  if (response.status === 200) {
    const usersFromDB = await response.json();
    uuidToUsers = await usersFromDB;
  }
}
async function getChatMessagesFromDB(db) {
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };
  const response = await fetch(`/api/channels/${db}`, options);
  if (response.status === 200) {
    const db = await response.json();
    return db;
  }
}
async function addMessageToChatFromDB(dbInput) {
  await updateUuidToUsername();
  const db = await dbInput;
  db.forEach(async (data) => {
    const message = await data.message;
    const uuid = await data.uuid;
    const user = uuidToUsers.find((user) => user.uuid === Number(uuid));
    const username = user.username;
    const timestamp = await data.timestamp;

    const element = createChatElement(message, username, timestamp);
    chatMessageList.appendChild(element);
  });

  updateScroll();
}
async function addNewMessageToDB(newMessage, timestamp) {
  await updateUuidToUsername();
  const userAddMessage = loggedinUser;
  const uuidObject = uuidToUsers.find(
    (user) => user.username == userAddMessage
  );
  const uuid = uuidObject.uuid;
  const message = {
    channel_name: activeChannel,
    uuid: uuid,
    message: newMessage,
    timestamp: timestamp,
  };
  const options = {
    method: "POST",
    body: JSON.stringify(message),
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = await fetch("/api/channels/", options);
  if (response.status === 201) {
    console.log("MessageAdded to DB");

    return;
  }
  updateScroll();
}
async function addNewMessage() {
  const newMessage = inputNewMessage.value;
  const timestamp = new Date().toString().slice(4, 24);

  const element = createChatElement(newMessage, loggedinUser, timestamp);
  chatMessageList.appendChild(element);

  await addNewMessageToDB(newMessage, timestamp);
  updateScroll();
  inputNewMessage.value = "";
  newMessageButton.disabled = true;
}

function createChatElement(newMessage, user, timestamp) {
  const message = document.createElement("div");
  message.className = "message";

  const messageboxLeft = document.createElement("div");
  messageboxLeft.className = "messagebox-left";

  const messageInfo = document.createElement("div");
  messageInfo.className = "message-info";

  const messageUser = document.createElement("p");
  messageUser.className = "message-user";
  messageUser.innerText = user;

  const messageTimestamp = document.createElement("p");
  messageTimestamp.className = "message-timestamp";
  messageTimestamp.innerText = timestamp;

  const messageMain = document.createElement("div");
  messageMain.className = "message-main";

  const messageText = document.createElement("p");
  messageText.className = "message-text";
  messageText.innerText = newMessage;

  const messageboxRight = document.createElement("div");
  messageboxRight.className = "messagebox-right";

  const div = document.createElement("div");

  //Creating buttons
  const editButton = document.createElement("button");
  editButton.innerText = "Edit";
  editButton.className = "messagebox-right-edit";

  const deleteButton = document.createElement("button");
  deleteButton.innerText = "Delete";

  messageInfo.appendChild(messageUser);
  messageInfo.appendChild(messageTimestamp);

  messageMain.appendChild(messageText);

  messageboxLeft.appendChild(messageInfo);
  messageboxLeft.appendChild(messageMain);

  div.appendChild(editButton);
  div.appendChild(deleteButton);
  messageboxRight.appendChild(div);

  message.appendChild(messageboxLeft);
  message.appendChild(messageboxRight);

  return message;
}

function updateScroll() {
  chatMessageList.scrollTop = chatMessageList.scrollHeight;
}
function generateGoodDate() {
  return (date = new Date().toString().slice(4, 24));
}
function isInputFieldNotEmpty(inputField) {
  let data = inputField.value;
  if (data.length >= 1 || data.value === "") {
    return false;
  } else {
    return true;
  }
}
function updateChatMessages(activeChannel) {
  chatMessageList.innerHTML = "";
  selectedChannel.innerText = activeChannel;
  addMessageToChatFromDB(getChatMessagesFromDB(activeChannel));
}
function getJWT() {
  let maybyJson = localStorage.getItem(JWT_KEY);
  console.log("mayby", maybyJson);
  if (!maybyJson) {
    return;
  }
  return maybyJson;
}
