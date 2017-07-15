'use strict';

var express = require('express');
var path = require('path');
var fs = require('fs');

var router = express.Router();

var addRoutes = function(dir, db) {
  fs.readdirSync(dir)
    .filter(function(file) {
      return (file.indexOf('.') !== 0);
    })
    .forEach(function(file) {
      require(path.join(dir, file))(router, db);
    });
};

var addDirs = function(db) {
  const curDir = path.resolve('server/routes');
  fs.readdirSync(curDir)
    .filter(function(dir) {
      const dirPath = path.join(curDir, dir);
      return fs.lstatSync(dirPath).isDirectory();
    })
    .forEach(function(dir) {
      const dirPath = path.join(curDir, dir);
      addRoutes(dirPath, db);
    });
};

var db = {}; // maybe later
addDirs(db);

// For all other routes return the main index.html, so react-router render the route in the client
router.get('*', (req, res) => {
	res.sendFile(path.resolve('build', 'index.html'));
});

module.exports = router;
