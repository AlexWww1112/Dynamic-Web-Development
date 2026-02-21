const express = require('express');
const nedb = require('@seald-io/nedb');

const app = express();
const database = new nedb({ filename:'database.txt', autoload:true });

//middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

//routes
app.get('/create', (req, res) => {
    res.sendFile('make-a-post.html', { root: "./public" });
});

app.post('/post', (req, res) => {
    console.log(req.body);

    let dataToBeAdded = {
        username: req.body.user,
        content: req.body.content
    };

    database.insert(dataToBeAdded, (err, dbData) => {
        if(err) consle.log(err);
        console.log(dbData);
    });
    res.send('hihihihi');
});

app.listen(80,() => {
    console.log('Server is running on port 80');
});
