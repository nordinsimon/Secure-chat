const inputauthUsername = document.querySelector("#auth-username");
const inputauthPassword = document.querySelector("#auth-password");
const authsigninButton = document.querySelector("#auth-signin");

const chatMessageList = document.querySelector("#chat-messege-list");

const inputNewMessage = document.querySelector("#input-new-message");
const newMessageButton = document.querySelector("#new-message-button");

const publicChat = document.querySelector("#public-chat");
const privateChat = document.querySelector("#private-chat");

//
//
// SERVER START
//
//

const JWT_KEY = "login-jwt";
let isLoggedIn = false;
let loggedinUser = "";
let activeChannel = "Public";
let uuidToUsers = [];

authsigninButton.addEventListener("click", signIn);
inputauthPassword.addEventListener("keyup", (e) => {
  if (e.key === "Enter" && authsigninButton.disabled === false) {
    signIn();
  }
  authsigninButton.disabled = isInputFieldNotEmpty(inputauthPassword);
});
newMessageButton.addEventListener("click", addNewMessageToChat);
inputNewMessage.addEventListener("keyup", (e) => {
  //If enter is pressed send new message to chat
  if (e.key === "Enter" && newMessageButton.disabled === false) {
    addNewMessageToChat();
  }
  // Checks if input feeld is empy or not and set new message button disabled
  let isItOkToSendMessage =
    isInputFieldNotEmpty(inputNewMessage) || !isLoggedIn;
  newMessageButton.disabled = isItOkToSendMessage;
});

updateUuidToUsername();
addMessageToChatFromDB(getChatMessagesFromDB(activeChannel));

//
//
// FUNCTIONS
//
//
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
  const db = await dbInput;
  db.forEach((data) => {
    const message = data.message;
    const uuid = data.uuid;
    const user = uuidToUsers.find((user) => user.uuid === Number(uuid));
    const username = user.username;
    const timestamp = data.timestamp;

    const element = createChatElement(message, username, timestamp);
    chatMessageList.appendChild(element);
  });

  updateScroll();
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
function addNewMessageToChat() {
  const newMessage = inputNewMessage.value;

  inputNewMessage.value = "";
  newMessageButton.disabled = true;
  const date = generateGoodDate();

  const element = createChatElement(newMessage, loggedinUser, date);
  chatMessageList.appendChild(element);
  updateScroll();
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
