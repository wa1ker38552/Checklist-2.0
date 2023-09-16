async function fetchGroups() {
  const a = await fetch('/api/fetch/groups')
  const b = await a.json()
  if (b.success) {
    return b.groups
  }
}

async function fetchTask(index) {
  const a = await fetch("/api/fetch/task?index="+index)
  const b = await a.json()
  if (b.success) {
    return b.data
  }
}

function getBaseGroup(group) {
  let e = document.createElement("div")
  let color = document.createElement("div")
  let text = document.createElement("div")
  
  e.className = "group centered-children"
  color.style.background = group.color
  color.className = "group-color"
  text.innerHTML = group.name
  e.title = group.name
  e.append(color, text)
  return e
}

function configureTask(option, index, completed) {
  switch(option) {
  case "icon_star":
    fetch("/api/configure/star", {
      method: "POST",
      body: JSON.stringify({
        index: index
      })
    })
      .then(response => response.json())
      .then(response => {
        if (response.success) {
          fetchTasks("active")
            .then(tasks => {
              renderTasks(tasks)
            })
        } else {
          document.getElementsByClassName("error-modal")[1].style.display = "none"
          setTimeout(function() {document.getElementsByClassName("error-modal")[0].style.display = ""}, 100)
          document.getElementsByClassName("error-modal")[0].style.display = "none"
          document.querySelector("#errorText").innerHTML = response.message
        }
      })
    break
  case "icon_check":
    fetch("/api/configure/check", {
      method: "POST",
      body: JSON.stringify({
        index: index
      })
    })
      .then(response => response.json())
      .then(response => {
        if (response.success) {
          fetchTasks("active")
            .then(tasks => {
              renderTasks(tasks)
            })
          document.getElementsByClassName("error-modal")[0].style.display = "none"
          setTimeout(function() {document.getElementsByClassName("error-modal")[1].style.display = ""}, 100)
          document.getElementsByClassName("error-modal")[1].style.display = "none"
          document.querySelector("#successText").innerHTML = "Successfully marked task as complete"
        } else {
          document.getElementsByClassName("error-modal")[1].style.display = "none"
          setTimeout(function() {document.getElementsByClassName("error-modal")[0].style.display = ""}, 100)
          document.getElementsByClassName("error-modal")[0].style.display = "none"
          document.querySelector("#errorText").innerHTML = response.message
        }
      })
    break
  case "icon_delete":
    fetch("/api/configure/delete?type="+((completed) ? "completed" : "active"), {
      method: "POST",
      body: JSON.stringify({
        index: index
      })
    })
      .then(response => response.json())
      .then(response => {
        if (response.success) {
          fetchTasks((completed) ? "completed" : "active")
            .then(tasks => {
              renderTasks(tasks, completed)
            })
          document.getElementsByClassName("error-modal")[0].style.display = "none"
          setTimeout(function() {document.getElementsByClassName("error-modal")[1].style.display = ""}, 100)
          document.getElementsByClassName("error-modal")[1].style.display = "none"
          document.querySelector("#successText").innerHTML = "Successfully deleted task"
        } else {
          document.getElementsByClassName("error-modal")[1].style.display = "none"
          setTimeout(function() {document.getElementsByClassName("error-modal")[0].style.display = ""}, 100)
          document.getElementsByClassName("error-modal")[0].style.display = "none"
          document.querySelector("#errorText").innerHTML = response.message
        }
      })
    break
  case "icon_undo":
    fetch("/api/configure/restore", {
      method: "POST",
      body: JSON.stringify({
        index: index
      })
    })
      .then(response => response.json())
      .then(response => {
        if (response.success) {
          fetchTasks("completed")
            .then(tasks => {
              renderTasks(tasks, true)
            })
          document.getElementsByClassName("error-modal")[0].style.display = "none"
          setTimeout(function() {document.getElementsByClassName("error-modal")[1].style.display = ""}, 100)
          document.getElementsByClassName("error-modal")[1].style.display = "none"
          document.querySelector("#successText").innerHTML = "Successfully restored task"
        } else {
          document.getElementsByClassName("error-modal")[1].style.display = "none"
          setTimeout(function() {document.getElementsByClassName("error-modal")[0].style.display = ""}, 100)
          document.getElementsByClassName("error-modal")[0].style.display = "none"
          document.querySelector("#errorText").innerHTML = response.message
        }
      })
    break
    case "icon_edit":
      (async function() {
        await openEditTaskModal()
        fetchTask(index)
          .then(task => {
            document.querySelector("#saveEditTask").onclick = function() {editTask(index)}
            // hard coded wait because js is so stupid and await is broken
            document.querySelector("#editTaskName").value = task.name
            document.querySelector("#editTaskNameCounter").innerHTML = task.name.length+"/50"
            document.querySelector("#editTaskNameCounter").style.color = ""
            if (task.important) {
              markImportant(document.querySelector("#editTaskStar"))
            }
            setTimeout(function() {
              let groupChildren = document.getElementById("editGroupsContainer").children
              if (task.group) {
                for (let i=0; i<groupChildren.length; i++) {
                  if (groupChildren[i].title == task.group.name) {
                    groupChildren[i].classList.add("selectedGroup")
                  }
                }
              }
            }, 200)
          })
      })()
  }
}

function renderManageGroups(groups) {
  // javascript being high, wtf is it doing ?? 
  const parent = document.getElementById("manageGroupsContainer")
  groups.forEach(function(g) {
    let groupEle = getBaseGroup(g)
    let deleteButton = document.createElement("div")
    deleteButton.className = "group-delete"
    deleteButton.innerHTML = "x"
    deleteButton.onclick = function() {deleteGroup(groupEle.children[1].innerHTML)}
    groupEle.append(deleteButton)
    parent.append(groupEle)
  })

  if (groups.length == 0) {
    parent.innerHTML = "No groups created yet"
  }
}

function renderTasks(tasks, completed=false) {
  const important = document.querySelector("#importantTasks")
  const regular = document.querySelector("#regularTasks")
  important.innerHTML = ""
  regular.innerHTML = ""
  
  let hasImportant = false
  let i = 0
  tasks.forEach(function(task) {
    const e = document.createElement("div")
    e.id = "group_"+i
    e.className = "task"
    const textContainer = document.createElement("div")
    const title = document.createElement("div")
    let textParent
    
    if (task.group) {
      const group = document.createElement("div")
      group.className = "task-group"
      group.innerHTML = task.group.name
      textContainer.append(group)
      if (task.important) {
        e.style.borderImage = `linear-gradient(to right, ${task.group.color}, ${task.group.color}) 1`
      } else {
        e.style.borderImage = `linear-gradient(to right, ${task.group.color}, #a6a6a6) 1`
      }
    } else {
      textContainer.classList.add("centered-vertically")
    }
    
    title.className = "task-title"
    title.innerHTML = task.name

    if (task.important) {
      textParent = document.createElement("div")
      textParent.style.display = "grid"
      textParent.style.gridTemplateColumns = "auto 1fr"
      textParent.style.gridGap = "0.5em"

      const imgContainer = document.createElement("div")
      const img = document.createElement("img")
      imgContainer.className = "centered-vertically"
      img.src = "/static/assets/icon_star_filled.png"
      img.className = "filled-star"
      img.style.width = "1.5em"
      img.style.height = "1.5em"
      imgContainer.append(img)
      textParent.prepend(imgContainer)
      textParent.append(textContainer)
    }
    
    textContainer.append(title)
    const buttonContainer = document.createElement("div")
    buttonContainer.className = "centered-vertically"
    buttonContainer.style.gap = "0.2em"
    buttonContainer.style.justifyContent = "right"

    ;["icon_star", "icon_edit", "icon_check", "icon_delete"].forEach(function(e) {
      if (completed && e != "icon_delete") {}
      else {
        const button = document.createElement("button")
        const img = document.createElement("img")
        const constI = i
        button.onclick = function() {configureTask(e, constI, completed)}
        button.className = "config-button"
  
        if (task.important && e == "icon_star") {
          img.src = `/static/assets/icon_remove_star.png`
          button.title = "Unstar task"
        } else {
          img.src = `/static/assets/${e}.png`
          button.title = e.split("_")[1].slice(0, 1).toUpperCase()+e.split("_")[1].slice(1)+" task"
        }
        button.append(img)
        buttonContainer.append(button)
      }
    })

    if (completed) {
      const button = document.createElement("button")
      const img = document.createElement("img")
      const constI = i
      button.onclick = function() {configureTask("icon_undo", constI)}
      button.className = "config-button"
      img.src = "/static/assets/icon_undo.png"
      button.title = "Restore task"
      button.append(img)
      buttonContainer.prepend(button)
    }
    
    i += 1

    if (task.important) {
      e.append(textParent, buttonContainer)
    } else {
      e.append(textContainer, buttonContainer)
    }
    if (task.important && completed == false) {
      hasImportant = true
      important.append(e)
    } else {
      regular.append(e)
    }
  })

  if (hasImportant) {
    important.style.marginBottom = "1.5em"
  }

  if (completed) {
    important.style.displaly = "flex"
    important.style.flexDirection = "column-reverse"
    regular.style.displaly = "flex"
    regular.style.flexDirection = "column-reverse"
  }
}

function renderSelectGroups(groups) {
  const parent = document.getElementById("selectGroupsContainer")
  groups.forEach(function(e) {
    let groupEle = getBaseGroup(e)
    groupEle.style.cursor = "pointer"
    groupEle.onclick = function() {
      let self = false
      try {
        if (document.getElementsByClassName("selectedGroup")[0] == groupEle) {self = true}
        document.getElementsByClassName("selectedGroup")[0].classList.remove("selectedGroup")
        
      } catch (e) {}
      if (!self) {groupEle.classList.add("selectedGroup")}
    }
    parent.append(groupEle)
  })

  if (groups.length == 0) {
    parent.innerHTML = "No groups created yet"
  }
}

function renderEditGroups() {
  fetchGroups()
    .then(groups => {
      const parent = document.getElementById("editGroupsContainer")
      parent.innerHTML = ""
      groups.forEach(function(e) {
        let groupEle = getBaseGroup(e)
        groupEle.style.cursor = "pointer"
        groupEle.onclick = function() {
          let self = false
          try {
            if (document.getElementsByClassName("selectedGroup")[0] == groupEle) {self = true}
            document.getElementsByClassName("selectedGroup")[0].classList.remove("selectedGroup")
            
          } catch (e) {}
          if (!self) {groupEle.classList.add("selectedGroup")}
        }
        parent.append(groupEle)
      })
    
      if (groups.length == 0) {
        parent.innerHTML = "No groups created yet"
      }
    })
}

function refreshGroups(e, item) {
  e.style.cursor = "not-allowed"
  document.getElementsByClassName("groups-container")[item].innerHTML = ""
  fetchGroups()
    .then(groups => {
      if (item == 0) {renderManageGroups(groups)}
      else {renderSelectGroups(groups)}
      e.style.cursor = ""
  })
}

async function fetchTasks(type) {
  const a = await fetch("/api/fetch/tasks?type="+type)
  const b = await a.json()
  if (b.success) {
    return b.tasks
  }
}

// Setup for fetching data
function querySetup() {
  fetchGroups()
    .then(groups => {
      renderSelectGroups(groups)
      renderManageGroups(groups)
  })
  fetchTasks("active")
    .then(tasks => {
      renderTasks(tasks)
    })
}