// Toggles the group manager modal
function openGroupModal() {
  document.getElementById("groupManagerModal").style.display = ""
  document.getElementById("groupName").focus()
}

function closeGroupModal() {
  document.getElementById("groupManagerModal").style.display = "none"
}

// Toggles the task creation modal
function openTaskModal() {
  document.getElementById("createTaskModal").style.display = ""
  document.getElementById("taskName").focus()
}

function closeTaskModal() {
  document.getElementById("createTaskModal").style.display = "none"
}

// Toggles setting modal
function openSettingsModal() {
  document.getElementById("settingsModal").style.display = ""
}

function closeSettingsModal() {
  document.getElementById("settingsModal").style.display = "none"
}

// Toggles confirmation modal (this modal can't be closed by clicking background. DONE ON PURPOSE)
function openConfirmationModal() {
  document.getElementById("confirmationModal").children[0].style.borderColor = "transparent"
  document.getElementById("confirmationModal").style.display = ""
}

function closeConfirmationModal() {
  document.getElementById("confirmationModal").style.display = "none"
}

//toggles edit task modal
async function openEditTaskModal() {
  await renderEditGroups()
  let child = document.querySelector("#editTaskStar").children[0]
  if (child.src.includes("filled")) {
    child.src = "/static/assets/icon_star.png"
    child.classList.remove("filled-star")
  }
  document.getElementById("editTaskModal").style.display = ""
}

function closeEditTaskModal() {
  document.getElementById("editTaskModal").style.display = "none"
}