const path = require("path");
const express = require("express");
const app = express();

app.use('/',express.static(__dirname));
app.use('/library/', express.static(path.resolve(__dirname, '..')))
console.log(path.resolve(__dirname, '..'))
app.listen(1235)