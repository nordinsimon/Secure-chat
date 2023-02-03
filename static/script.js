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
let activeChannel = 1;
let uuidToUsers = [];
let authPage = "";

let scrollposition;
let newChannelSecureStatus = "public";

let loadJWT = getJWT();

updateUuidToUsername();
updateChatMessages(activeChannel);
addChannelsToChannelsListFromDB();
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
  if (newChannelSecureStatusToBoolean(newChannelSecureStatus)) {
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
    let userToken = await response.json();

    localStorage.setItem(JWT_KEY, userToken.token);
    loadJWT = await userToken.token;
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
      authorization: loadJWT,
    },
  };
  const response = await fetch(`/api/channels/${db}`, options);
  if (response.status === 401) {
    return false;
  }
  if (response.status === 200) {
    const db = await response.json();
    return db;
  }
}
async function addMessageToChatFromDB(dbInput) {
  await updateUuidToUsername();
  if (dbInput === false) return;
  chatMessageList.innerHTML = "";
  const db = await dbInput;
  db.forEach(async (data) => {
    const message = await data.message;
    const uuid = await data.uuid;
    const user = await uuidToUsers.find((user) => user.uuid === Number(uuid));
    const username = await user.username;
    const timestamp = await data.timestamp;
    const messageid = await data.messageid;
    const isChanged = await data.ischanged;
    const isDeleted = await data.isdeleted;

    let updatedTime = "";

    if (isDeleted) {
      updatedTime = ` - Deleted:  ${data.updatedtime}`;
    } else if (isChanged) {
      updatedTime = ` - Edited:  ${data.updatedtime}`;
    }

    const element = createChatElement(
      message,
      username,
      timestamp,
      messageid,
      updatedTime
    );
    chatMessageList.appendChild(element);
  });
}
async function addNewMessageToDB(newMessage) {
  await updateUuidToUsername();
  const userAddMessage = loggedinUser;
  const uuidObject = uuidToUsers.find(
    (user) => user.username == userAddMessage
  );
  const uuid = uuidObject.uuid;
  console.log(uuid);
  const message = {
    channelId: activeChannel,
    uuid: uuid,
    message: newMessage,
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
}
async function addNewMessage() {
  const newMessage = inputNewMessage.value;

  await addNewMessageToDB(newMessage);

  await updateChatMessages();
  inputNewMessage.value = "";
  newMessageButton.disabled = true;
}
async function updateChatMessages(scrollStatus) {
  chatMessageList.innerHTML = "";
  await addMessageToChatFromDB(await getChatMessagesFromDB(activeChannel));
  setTimeout(() => {
    updateEventListenerMessages();
    updateScroll(scrollStatus);
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
async function getAllChannelsFromDB() {
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };
  const response = await fetch("/api/channels/", options);
  if (response.status === 200) {
    const allChannels = await response.json();
    return allChannels;
  }
}
async function addChannelsToChannelsListFromDB() {
  channelsList.innerHTML = "";
  const channels = await getAllChannelsFromDB();
  channels.forEach((channel) => {
    const element = createChannelElement(
      channel.channel_name,
      channel.secure_status,
      channel.channelid
    );
    channelsList.appendChild(element);
  });
  updateEventListenerChannels();
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

  /*   const element = createChannelElement(newChannel, secureStatus);
  channelsList.appendChild(element); */
  inputNewChannel.value = "";
  addChatButton.disabled = true;
  setBackChatButton();

  await addNewChannelToDb(newChannel, secureStatus);
  console.log("addNewchannel");
  await addChannelsToChannelsListFromDB();
}
async function deleteMessageFromDB(messageId, scrollStatus) {
  if (!isLoggedIn) return;
  const messageToDelet = {
    channelId: activeChannel,
    messageId: Number(messageId),
  };
  const options = {
    method: "DELETE",
    body: JSON.stringify(messageToDelet),
    headers: {
      "Content-Type": "application/json",
      authorization: loadJWT,
    },
  };

  const response = await fetch("/api/channels/", options);
  if (response.status === 401) {
    console.log("Unathorised to Delete");
    return;
  }
  if (response.status === 200) {
    console.log("Message Deleted");
    await updateChatMessages(scrollStatus);
    return;
  }
}
async function editMessageFromDB(newMessage, messageId, scrollStatus) {
  if (!isLoggedIn) return;
  const messageToEdit = {
    channelId: activeChannel,
    messageId: Number(messageId),
    newMessage: newMessage,
  };
  const options = {
    method: "PUT",
    body: JSON.stringify(messageToEdit),
    headers: {
      "Content-Type": "application/json",
      authorization: loadJWT,
    },
  };

  const response = await fetch("/api/channels/", options);
  if (response.status === 401) {
    console.log("Unathorised to edit");
    return;
  }
  if (response.status === 200) {
    console.log("Message EDITED");
    await updateChatMessages(scrollStatus);
    return;
  }
}

function createChatElement(
  newMessage,
  user,
  timestamp,
  messageId,
  updatedTime
) {
  const message = document.createElement("li");
  message.className = "message";
  message.accessKey = messageId;

  const messageboxLeft = document.createElement("div");
  messageboxLeft.className = "messagebox-left";

  const messageInfo = document.createElement("div");
  messageInfo.className = "message-info";

  const messageUser = document.createElement("p");
  messageUser.className = "message-user";
  messageUser.innerText = user;

  const messageTimestamp = document.createElement("p");
  messageTimestamp.className = "message-timestamp";
  messageTimestamp.innerText = timestamp + updatedTime;

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
  deleteButton.className = "messagebox-right-delete";

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
function createChannelElement(channelName, secureStatus, channelid) {
  const li = document.createElement("li");
  li.name = channelName;
  li.accessKey = channelid;
  li.id = `channelid-${channelid}`;
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
function updateScroll(scrollStatus) {
  let scrollTo = chatMessageList.scrollHeight;
  if (scrollStatus === false) {
    scrollTo = scrollposition;
  }
  chatMessageList.scrollTop = scrollTo;
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
  activeChannel = 1;
  localStorage.removeItem(JWT_KEY);
  loadJWT = "";
  inputNewMessage.value = "";
  inputNewMessage.placeholder = "Sign in to send message!";
  inputNewMessage.disabled = true;
  authUserBox.className = "header-is-loggedin-box";
  headerIsLoggedinBox.className = "hide";
  newChatButton.disabled = true;
  selectedChannel.innerText = "Public";

  updateChatMessages();
  setAuthBackPage();
  setBackChatButton();
}
function newChannelSecureStatusToBoolean(secureStatus) {
  if (secureStatus === "private") {
    return true;
  } else return false;
}
function updateEventListenerChannels() {
  let list = channelsList.getElementsByTagName("li");
  for (let i = 0; i < list.length; i++) {
    list[i].addEventListener("click", async (e) => {
      const element = list[i].accessKey;
      activeChannel = element;
      await updateChatMessages();
      selectedChannel.innerText = list[i].name;
    });
  }
  console.log("Event Listener Channels Updated");
}
function updateEventListenerMessages() {
  let list = chatMessageList.getElementsByTagName("li");
  for (let i = 0; i < list.length; i++) {
    list[i]
      .querySelector(".messagebox-right-edit")
      .addEventListener("click", (e) => {
        scrollposition = chatMessageList.scrollTop;
        editMessageFromDB(inputNewMessage.value, list[i].accessKey, false);
      });

    list[i]
      .querySelector(".messagebox-right-delete")
      .addEventListener("click", (e) => {
        scrollposition = chatMessageList.scrollTop;
        deleteMessageFromDB(list[i].accessKey, false);
      });
  }
  console.log("Event Listener Edit Updated");
}
