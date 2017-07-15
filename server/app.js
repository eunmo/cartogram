const express = require('express');
const path = require('path');

const app = express();
const routes = require('./routes/index');

// Serve static assets
app.use(express.static(path.resolve('build')));

app.use('/', routes);

module.exports = app;
