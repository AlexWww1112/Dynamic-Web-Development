window.onload = function () {

  getTodos();

  document.getElementById("addBtn").addEventListener("click", async function () {

    const input = document.getElementById("todoInput");

    await fetch("/todos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: input.value })
    });

    input.value = "";
    getTodos();
  });

  document.getElementById("deleteCompletedBtn").addEventListener("click", async function () {
    await fetch("/todos/completed", {
      method: "DELETE"
    });
    getTodos();
  });

};

// get data
async function getTodos() {
  const response = await fetch("/todos");
  const data = await response.json();
  renderTodos(data);
}

function renderTodos(todos) {
  const list = document.getElementById("todoList");
  list.innerHTML = "";

  todos.forEach(todo => {
    const li = document.createElement("li");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.addEventListener("change", async function () {
      await fetch(`/todos/${todo.id}/toggle`, {
        method: "POST"
      });
      getTodos();
    });

    const textSpan = document.createElement("span");
    textSpan.textContent = " " + todo.text;
    if (todo.completed) {
      textSpan.style.textDecoration = "line-through";
    }

    li.appendChild(checkbox);
    li.appendChild(textSpan);
    list.appendChild(li);
  });
}
