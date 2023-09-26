function createGroup() {
  fetch("/api/create/group", {
    method: "POST",
    body: JSON.stringify({
      name: document.getElementById("groupName").value,
      color: document.getElementById("groupColor").value
    })
  })
    .then(response => response.json())
    .then(response => {
      if (response.success) {
        document.getElementsByClassName("groups-container")[0].innerHTML = ""
        fetchGroups()
          .then(groups => {
            renderManageGroups(groups)
          })
      } else {
        setTimeout(function() {document.getElementById("groupCreationError").innerHTML = response.message}, 100)
        document.getElementById("groupCreationError").innerHTML = ""
      }
    })
}

function deleteGroup(groupName) {
  fetch("/api/delete/group", {
    method: "POST",
    body: JSON.stringify({
      name: groupName
    })
  })
    .then(response => response.json())
    .then(response => {
      if (response.success) {
        document.getElementsByClassName("groups-container")[0].innerHTML = ""
        fetchGroups()
          .then(groups => {
            renderManageGroups(groups)
          })
      }
    })
  
}

function markImportant(e) {
  const child = e.children[0]
  if (child.src.includes("filled")) {
    child.src = "/static/assets/icon_star.png"
    child.classList.remove("filled-star")
  } else {
    child.src = "/static/assets/icon_star_filled.png"
    child.classList.add("filled-star")
  }
}

function closeError(i) {
  document.getElementsByClassName("error-modal")[i].style.display = "none"
}

function createTask() {
  let group = null
  try {
    group = document.getElementsByClassName("selectedGroup")[0].textContent
  } catch (e) {}
  fetch("/api/create/task", {
    method: "POST",
    body: JSON.stringify({
      name: document.querySelector("#taskName").value,
      group: group,
      important: (document.querySelector("#starTask").children[0].src.includes("filled")) ? true : false
    })
  })
    .then(response => response.json())
    .then(response => {
      if (response.success) {
        let name = document.querySelector("#taskName").value
        document.querySelector("#taskName").value = ""
        try {document.getElementsByClassName("selectedGroup")[0].classList.remove("selectedGroup")} catch (e) {}
        if (document.querySelector("#starTask").children[0].src.includes("filled")) {
          markImportant(document.querySelector("#starTask"))
        }
        document.querySelector("#taskNameCounter").innerHTML = "0/50"
        document.querySelector("#taskNameCounter").style.color = "red"
        fetchTasks("active")
          .then(tasks => {
            renderTasks(tasks)
          })
        setTimeout(function() {document.getElementsByClassName("error-modal")[1].style.display = ""}, 100)
        document.getElementsByClassName("error-modal")[1].style.display = "none"
        document.querySelector("#successText").innerHTML = `Task <span style="color: green">${name}</span> created`
      } else {
        setTimeout(function() {document.querySelector("#taskCreationError").innerHTML = response.message}, 100)
        document.querySelector("#taskCreationError").innerHTML = ""
      }
    })
}

function editTask(index) {
  let group = null
  try {
    group = document.getElementsByClassName("selectedGroup")[0].textContent
  } catch (e) {}
  fetch("/api/update/task?index="+index, {
    method: "POST",
    body: JSON.stringify({
      name: document.querySelector("#editTaskName").value,
      group: group,
      important: (document.querySelector("#editTaskStar").children[0].src.includes("filled")) ? true : false
    })
  })
    .then(response => response.json())
    .then(response => {
      if (response.success) {
        fetchTasks("active")
          .then(tasks => {
            renderTasks(tasks)
          })
        closeEditTaskModal()
        setTimeout(function() {document.getElementsByClassName("error-modal")[1].style.display = ""}, 100)
        document.getElementsByClassName("error-modal")[1].style.display = "none"
        document.querySelector("#successText").innerHTML = `Task <span style="color: green">${document.querySelector("#editTaskName").value}</span> updated`
      } else {
        setTimeout(function() {document.querySelector("#editTaskCreationError").innerHTML = response.message}, 100)
        document.querySelector("#editTaskCreationError").innerHTML = ""
      }
    })
}

function changePassword() {
  fetch("/api/settings/change-password", {
    method: "POST",
    body: JSON.stringify({
      original: document.querySelector("#originalPassword").value,
      newPassword: document.querySelector("#newPassword").value,
      newPasswordRepeat: document.querySelector("#newPasswordRepeat").value
    })
  })
    .then(response => response.json())
    .then(response => {
      if (response.success) {
        // wipe previous messages
        document.getElementsByClassName("error-modal")[0].style.display = "none"
        setTimeout(function() {document.getElementsByClassName("error-modal")[1].style.display = ""}, 100)
        document.getElementsByClassName("error-modal")[1].style.display = "none"
        document.querySelector("#successText").innerHTML = `Password changed`
      } else {
        // wipe previous messages
        document.getElementsByClassName("error-modal")[1].style.display = "none"
        setTimeout(function() {document.getElementsByClassName("error-modal")[0].style.display = ""}, 100)
        document.getElementsByClassName("error-modal")[0].style.display = "none"
        document.querySelector("#errorText").innerHTML = response.message
      }
    })
}

function promptDeleteAccount() {
  document.querySelector("#confirmationText").innerHTML = "Are you sure you want to delete your account? This action cannot be reversed and your account will permenantly be deleted. Your username can be used in the future by someone else."
  document.querySelector("#confirmationAction").innerHTML = "Delete account"
  openConfirmationModal()
}

function promptResetAccount() {
  document.querySelector("#confirmationText").innerHTML = "Are you sure you want to reset your account? This action cannot be reversed and all your tasks and groups will be deleted."
  document.querySelector("#confirmationAction").innerHTML = "Reset account"
  openConfirmationModal()
}

function destructiveAction() {
  let type = document.querySelector("#confirmationAction").innerHTML
  if (type == "Delete account") {
    fetch("/api/settings/delete-account", {
      method: "POST"
    })
      .then(location.reload())
  } else if (type == "Reset account") {
    fetch("/api/settings/reset-account", {
      method: "POST"
    })
      .then(response => response.json())
      .then(response => {
        if (response.success) {
          location.reload()
        }
      })
  }
}

// Setup event listeners
function eventSetup() {
  const taskNameCounter = document.querySelector("#taskNameCounter")
  const taskName = document.querySelector("#taskName")
  const groupNameCounter = document.getElementById("groupNameCounter")
  const groupName = document.getElementById("groupName")
  const editTaskName = document.querySelector("#editTaskName")
  const editTaskNameCounter = document.querySelector("#editTaskNameCounter") 

  groupName.addEventListener("input", function() {
    groupNameCounter.innerHTML = groupName.value.length+"/15"
    if (groupName.value.length > 25 || groupName.value.length < 1) {
      groupNameCounter.style.color = "red"
    } else {
      groupNameCounter.style.color = ""
    }
  })

  groupName.addEventListener("input", function() {
    groupNameCounter.innerHTML = groupName.value.length+"/15"
    if (groupName.value.length > 25 || groupName.value.length < 1) {
      groupNameCounter.style.color = "red"
    } else {
      groupNameCounter.style.color = ""
    }
  })

  taskName.addEventListener("input", function() {
    taskNameCounter.innerHTML = taskName.value.length+"/50"
    if (taskName.value.length > 50 || taskName.value.length < 1) {
      taskNameCounter.style.color = "red"
    } else {
      taskNameCounter.style.color = ""
    }
  })

  editTaskName.addEventListener("input", function() {
    editTaskNameCounter.innerHTML = editTaskName.value.length+"/50"
    if (editTaskName.value.length > 50 || editTaskName.value.length < 1) {
      editTaskNameCounter.style.color = "red"
    } else {
      editTaskNameCounter.style.color = ""
    }
  })

  window.onclick = function(e) {
    // i should probably fix this so it targets class instead :\
    if (e.target == document.querySelector("#groupManagerModal")) {
      closeGroupModal()
    } else if (e.target == document.querySelector("#createTaskModal")) {
      closeTaskModal()
    } else if (e.target == document.querySelector("#settingsModal")) {
      closeSettingsModal()
    } else if (e.target == document.querySelector("#confirmationModal")) {
      document.querySelector("#confirmationModal").children[0].style.borderColor = "red"
      document.querySelector("#confirmationModal").children[0].style.borderStyle = "solid"
      document.querySelector("#confirmationModal").children[0].style.borderWidth = "2px"
    } else if (e.target == document.querySelector("#editTaskModal")) {
      closeEditTaskModal()
    }
  }
}