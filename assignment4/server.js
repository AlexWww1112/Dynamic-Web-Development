//library import
const express = require("express");
const bodyParser = require("body-parser");

//instance of express class
const app = express();

//allow the use of my static files (front-end code)
app.use(express.static('public'));

// const parser = bodyParser.urlencoded({extended: true});
// app.use(parser);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let todos = [
//   { id: 1, text: "Finish homework", completed: false },
//   { id: 2, text: "Go to gym", completed: false }
];

//setting up
app.get("/todos", (request, response) => {
  response.json(todos);
});

app.post("/todos", (request, response) => {
  const newTodo = {
    id: Date.now(),
    text: request.body.text,
    completed: false
  };

  todos.push(newTodo);
  response.json(newTodo);
});

app.post("/todos/:id/toggle", (request, response) => {
  const id = parseInt(request.params.id, 10);
  if (Number.isNaN(id)) {
    return response.status(400).json({ message: "Invalid todo id" });
  }

  const todo = todos.find(t => t.id === id);

  if (!todo) {
    return response.status(404).json({ message: "Not found" });
  }

  todo.completed = !todo.completed;
  response.json(todo);
});

app.delete("/todos/completed", (request, response) => {
  todos = todos.filter(todo => !todo.completed);
  response.json({ message: "Completed todos deleted" });
});

app.delete("/todos/:id", (request, response) => {
  const id = parseInt(request.params.id, 10);
  if (Number.isNaN(id)) {
    return response.status(400).json({ message: "Invalid todo id" });
  }

  todos = todos.filter(todo => todo.id !== id);
  response.json({ message: "Deleted" });
});

//start our express application
app.listen(3000,() => {
  console.log("start server is working");
});
