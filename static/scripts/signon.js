// Shows/hides password
function togglePassword() {
  const input = document.getElementsByTagName("input")[1]
  const toggle = document.getElementById("passwordToggle")
  if (toggle.innerHTML == "Show password") {
    input.type = "text"
    toggle.innerHTML = "Hide password"
  } else {
    input.type = "password"
    toggle.innerHTML = "Show password"
  }
}

// Toggles signup v login
function toggleType() {
  const title = document.getElementById("signonTitle")
  const subtitle = document.getElementById("signonSubtitle")
  const button = document.getElementById("actionButton")
  const footer = document.getElementById("footer")
  const google = document.getElementById("googlePrompt")
  if (title.innerHTML == "Welcome Back!") {
    title.innerHTML = "Create an account"
    subtitle.innerHTML = "Choose your username and password"
    subtitle.style = ""
    button.innerHTML = "Signup"
    button.onclick = function() {action("signup")}
    footer.innerHTML = "Already have an account? <a onclick='toggleType()'>Login</a>"
    google.innerHTML = "Signup with Google"
  } else {
    title.innerHTML = "Welcome Back!"
    subtitle.innerHTML = "Enter your username and password"
    subtitle.style = ""
    button.innerHTML = "Login"
    button.onclick = function() {action("login")}
    footer.innerHTML = "No account? <a onclick='toggleType()'>Signup</a>"
    google.innerHTML = "Signin with Google"
  }
}

// Executes login or signup depending on type
// @param type: signup or login
function action(type) {
  fetch(`/${type}`, {
    method: "POST",
    body: JSON.stringify({
      username: document.getElementById("username").value,
      password: document.getElementById("password").value
    })
  })
    .then(response => response.json())
    .then(response => {
      if (response.success) {
        window.location.href = "/callback?token="+response.token
      } else {
        // Hard coded 100 ms refresh so that users know that they are getting a 'new' message
        setTimeout(function() {document.getElementById("signonSubtitle").innerHTML = response.message}, 100)
        document.getElementById("signonSubtitle").style.color = "red"
        document.getElementById("signonSubtitle").innerHTML = ""
      }
    })
}