//library import
const express = require("express");
const bodyParser = require("body-parser");

//instance of express class
const app = express();

//allow the use of my static files (front-end code)
app.use(express.static('public'));

const parser = bodyParser.urlencoded({extended: true});
app.use(parser);

let messages = [];

//setting up my first handler for a route
app.get("/test", (request, response) => {
  response.send("server is working");
});

app.post('/sign', (request, response) => {
  console.log(request.body);

  messages.push({
    guestname: request.body.guestname,
    message: request.body.message
  })
  response.send("thank you for signing");
});

//start our express application
app.listen(8000,() => {
  console.log("start server is working");
});
