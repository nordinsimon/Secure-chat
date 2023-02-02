const headerIsLoggedinBox = document.querySelector("#header-is-loggedin-box");
const headerIsLoggedinText = document.querySelector("#header-is-loggedin-text");
const authUserBox = document.querySelector("#auth-user-box");
const authNewUser = document.querySelector("#auth-new-user");
const authLogin = document.querySelector("#auth-login");
const authInput = document.querySelector("#auth-input");
const inputauthUsername = document.querySelector("#auth-username");
const inputauthPassword = document.querySelector("#auth-password");
const authSignoutButton = document.querySelector("#auth-sign-out");
const authsigninButton = document.querySelector("#auth-signin");
const authCreateNewUser = document.querySelector("#auth-create-new-user");
const authBack = document.querySelector("#auth-back");

const chatMessageList = document.querySelector("#chat-messege-list");

const inputNewMessage = document.querySelector("#input-new-message");
const newMessageButton = document.querySelector("#new-message-button");

const channelsList = document.querySelector("#channels-list");
const publicChat = document.querySelector("#public-chat");
const privateChat = document.querySelector("#private-chat");
const inputNewChannel = document.querySelector("#input-new-channel");
const publicOrPrivareButton = document.querySelector(
  "#public-or-private-button"
);

const newChatButton = document.querySelector("#new-chat-button");
const addChatButton = document.querySelector("#add-chat-button");
const backChatButton = document.querySelector("#back-chat-button");

const selectedChannel = document.querySelector("#selected-channel");

//
//
// Webbsidan laddas
//
//

const JWT_KEY = "login-jwt";
let isLoggedIn = false;
let loggedinUser = "";
let activeChannel = "Public";
let uuidToUsers = [];
let authPage = "";

let newChannelSecureStatus = "public";

const loadJWT = getJWT();

updateUuidToUsername();
updateChatMessages(activeChannel);
checkIfJWTMatch(loadJWT);

// to set stages of login header
authLogin.addEventListener("click", setAuthLoginPage);
authNewUser.addEventListener("click", setAuthNewUserPage);
authBack.addEventListener("click", setAuthBackPage);

//To create new user
authCreateNewUser.addEventListener("click", createNewUser);

//to signin and create new user
authsigninButton.addEventListener("click", signIn);
inputauthPassword.addEventListener("keyup", async (e) => {
  if (e.key === "Enter") {
    if (authsigninButton.disabled === false && authPage === "Login") {
      await signIn();
    } else if (authCreateNewUser.disabled === false && authPage === "NewUser") {
      await createNewUser();
    }
    authsigninButton.disabled = isInputFieldNotEmpty(inputauthPassword);
    authCreateNewUser.disabled = isInputFieldNotEmpty(inputauthPassword);
  }
  authsigninButton.disabled = isInputFieldNotEmpty(inputauthPassword);
  authCreateNewUser.disabled = isInputFieldNotEmpty(inputauthPassword);
});

//to signout
authSignoutButton.addEventListener("click", signOut);

//To create new message
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

//To choose channel
publicChat.addEventListener("click", () => {
  activeChannel = "Public";
  updateChatMessages();
});
privateChat.addEventListener("click", () => {
  if (isLoggedIn === false) return;
  activeChannel = "Private";
  updateChatMessages();
});

//To navigate to create new channe
newChatButton.addEventListener("click", () => {
  newChatButton.className = "hide";
  inputNewChannel.className = "new-chat-input";
  addChatButton.className = "";
  backChatButton.className = "";
  publicOrPrivareButton.className = "";
});
backChatButton.addEventListener("click", setBackChatButton);

//To create new channel
publicOrPrivareButton.addEventListener("click", () => {
  if (newChannelSecureStatusToBoolean()) {
    newChannelSecureStatus = "public";
    publicOrPrivareButton.innerText = "Public";
  } else {
    newChannelSecureStatus = "private";
    publicOrPrivareButton.innerText = "Private";
  }
});
addChatButton.addEventListener("click", addNewChannel);
inputNewChannel.addEventListener("keyup", (e) => {
  if (e.key === "Enter" && addChatButton.disabled === false) {
    addNewChannel();
  }
  let isItOkToCreateChannel =
    isInputFieldNotEmpty(inputNewChannel) || !isLoggedIn;
  addChatButton.disabled = isItOkToCreateChannel;
});

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
    newChatButton.disabled = false;
    updateHeader();
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
    loggedinUser = await inputauthUsername.value;
    inputNewMessage.placeholder = "New message...";
    inputNewMessage.disabled = false;
    inputauthUsername.value = "";
    newChatButton.disabled = false;
    updateHeader();
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
  console.log(uuid);
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
async function updateChatMessages() {
  chatMessageList.innerHTML = "";
  selectedChannel.innerText = activeChannel;
  await addMessageToChatFromDB(await getChatMessagesFromDB(activeChannel));
  setTimeout(() => {
    updateScroll();
  }, 0);
}
async function createNewUser() {
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
  const response = await fetch("/api/users/", options);
  if (response.status === 201) {
    setAuthLoginPage();
    inputauthPassword.value = "";
  }
  inputauthPassword.value = "";
}
async function addNewChannelToDb(channel, secure) {
  const newChannel = {
    new_channel_name: channel,
    secure_status: secure,
  };
  const options = {
    method: "POST",
    body: JSON.stringify(newChannel),
    headers: {
      "Content-Type": "application/json",
    },
  };
  const response = await fetch("/api/channels/newchannel", options);
  if (response.status === 201) {
    console.log("channel Added to DB");
  }
}
async function addNewChannel() {
  if (!isLoggedIn) return;

  const newChannel = inputNewChannel.value;
  const secureStatus = newChannelSecureStatus;

  const element = createChannelElement(newChannel, secureStatus);
  channelsList.appendChild(element);
  inputNewChannel.value = "";
  addChatButton.disabled = true;
  setBackChatButton();

  addNewChannelToDb(newChannel, secureStatus);
  console.log("addNewchannel");
}
async function getAllChannelsFromDB() {
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };
  const response = await fetch("/api/channels/getallchannels", options);
  if (response.status === 200) {
    const db = await response.json();
    return db;
  }
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
function createChannelElement(channelName, secureStatus) {
  const li = document.createElement("li");
  const label = document.createElement("label");
  label.className = "channels-item-box";
  const span = document.createElement("span");
  span.innerText = channelName;

  label.appendChild(span);
  if (newChannelSecureStatusToBoolean(secureStatus)) {
    const div = document.createElement("div");
    div.className = "locked-status";
    div.innerText = "🔒";
    label.appendChild(div);
  }
  li.appendChild(label);
  return li;
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
function getJWT() {
  let maybyJson = localStorage.getItem(JWT_KEY);
  if (!maybyJson) {
    return;
  }
  return maybyJson;
}
function updateHeader() {
  if (!isLoggedIn) return;
  authUserBox.className = "hide";
  headerIsLoggedinBox.className = "header-is-loggedin-box";
  headerIsLoggedinText.innerText = `Welcome to secure chat ${loggedinUser}!`;
}
function setAuthLoginPage() {
  authPage = "Login";
  authLogin.className = "hide";
  authNewUser.className = "hide";
  authInput.className = "auth-input";
  authsigninButton.className = "auth-button";
  authBack.className = "auth-button";
  authCreateNewUser.className = "hide";
}
function setAuthNewUserPage() {
  authPage = "NewUser";
  authLogin.className = "hide";
  authNewUser.className = "hide";
  authInput.className = "auth-input";
  authCreateNewUser.className = "auth-button";
  authBack.className = "auth-button";
}
function setAuthBackPage() {
  authPage = "";
  authLogin.className = "auth-button";
  authNewUser.className = "auth-button";
  authInput.className = "hide";
  authsigninButton.className = "hide";
  authCreateNewUser.className = "hide";
  authBack.className = "hide";
}
function setBackChatButton() {
  newChatButton.className = "";
  inputNewChannel.className = "hide";
  addChatButton.className = "hide";
  backChatButton.className = "hide";
  publicOrPrivareButton.className = "hide";
}
function signOut() {
  isLoggedIn = false;
  loggedinUser = "";
  activeChannel = "Public";
  localStorage.removeItem(JWT_KEY);
  inputNewMessage.placeholder = "Sign in to send message!";
  inputNewMessage.disabled = true;
  authUserBox.className = "header-is-loggedin-box";
  headerIsLoggedinBox.className = "hide";
  newChatButton.disabled = true;

  updateChatMessages();
  setAuthBackPage();
}
function newChannelSecureStatusToBoolean() {
  if (newChannelSecureStatus === "private") {
    return true;
  } else return false;
}
