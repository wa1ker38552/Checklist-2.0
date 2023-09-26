// asume the modal is the first child of modal background
function animateModalOpen(m) {
  m.style.display = ""
  m.style.opacity = "1"
  m.style.background = "rgba(0, 0, 0, 0.7)"
  m.style.animation = "fade-in 0.3s"
  m.children[0].style.animation = "move-up 0.3s"
}

function animateModalClose(m) {
  setTimeout(function() {
    m.style.display = "none"
  }, 301)
  m.children[0].style.animation = "move-down 0.3s"
  m.style.animation = "fade-out 0.3s"
  m.style.opacity = 0
}

// Toggles the group manager modal
function openGroupModal() {
  animateModalOpen(document.getElementById("groupManagerModal"))
  document.getElementById("groupName").focus()
}

function closeGroupModal() {
  animateModalClose(document.getElementById("groupManagerModal"))
}

// Toggles the task creation modal
function openTaskModal() {
  animateModalOpen(document.getElementById("createTaskModal"))
  document.getElementById("taskName").focus()
}

function closeTaskModal() {
  animateModalClose(document.getElementById("createTaskModal"))
}

// Toggles setting modal
function openSettingsModal() {
  animateModalOpen(document.getElementById("settingsModal"))
}

function closeSettingsModal() {
  animateModalClose(document.getElementById("settingsModal"))
}

// Toggles confirmation modal (this modal can't be closed by clicking background. DONE ON PURPOSE)
function openConfirmationModal() {
  document.getElementById("confirmationModal").children[0].style.borderColor = "transparent"
  animateModalOpen(document.getElementById("confirmationModal"))
}

function closeConfirmationModal() {
  animateModalClose(document.getElementById("confirmationModal"))
}

//toggles edit task modal
async function openEditTaskModal() {
  await renderEditGroups()
  let child = document.querySelector("#editTaskStar").children[0]
  if (child.src.includes("filled")) {
    child.src = "/static/assets/icon_star.png"
    child.classList.remove("filled-star")
  }
  animateModalOpen(document.getElementById("editTaskModal"))
}

function closeEditTaskModal() {
  animateModalClose(document.getElementById("editTaskModal"))
}