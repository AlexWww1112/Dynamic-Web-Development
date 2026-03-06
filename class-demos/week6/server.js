const express = require('express');
const multer = require('multer');

const app = express();

app.use(express.static('client'));
app.use(express.urlencoded({ extended: true }));
const upload = multer({ dest: 'cilent/upload' });

app.listen(5004, () => {
    console.log('Server is running on port 5004');
});