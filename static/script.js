const inputauthUsername = document.getElementById("auth-username");
const inputauthPassword = document.querySelector("#auth-password");
const authsigninButton = document.querySelector("#auth-signin");

const JWT_KEY = "login-jwt";
let isLoggedIn = false;

authsigninButton.addEventListener("click", async () => {
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
  }
});
