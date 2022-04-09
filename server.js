/*==============================================================================
(C) Copyright 2018,2019,2022 John J Kauflin, All rights reserved. 
-----------------------------------------------------------------------------
DESCRIPTION: Main nodejs server to run the web and control functions for
                the grow environment monitor
-----------------------------------------------------------------------------
Modification History
2018-01-06 JJK  Initial version
2017-12-26 JJK  Got working as a systemd service on BBB after upgrading
                to BBB Debian 9.3 and NodeJS 6.12
2018-03-07 JJK  Moved board functions to boardFunctions
2018-03-21 JJK  Working on moisture and water control
2018-05-18 JJK  Modified to present and allow configuration updates from
                the web page
2019-09-08 JJK  Upgraded to Raspbian Buster and NodeJS v10
2019-09-28 JJK  Re-implementing web display and updates to config values
2022-04-03 JJK  Updating to ES6 and bootstrap 5
=============================================================================*/

// Read environment variables from the .env file
require('dotenv').config();
//import 'dotenv/config'
//EMONCMS_INPUT_URL=

var http = require('http');
//import * as http from 'http';
const express = require('express')
//import express from 'express'

var WEB_PORT = 3035;

// General handler for any uncaught exceptions
process.on('uncaughtException', function (e) {
  console.log("UncaughtException, error = " + e);
  console.error(e.stack);
  // Stop the process
  // 2017-12-29 JJK - Don't stop for now, just log the error
	//process.exit(1);
});

// Create a web server
var app = express();
var httpServer = http.createServer(app);

app.use('/',express.static('public'));
app.use(express.json());

// jjk new
app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send('Something broke!')
})

// Have the web server listen for requests
httpServer.listen(WEB_PORT,function() {
    console.log("Live at Port " + WEB_PORT + " - Let's rock!");
});


// Include the Arduino board functions
var boardFunctions = require('./boardFunctions.js');
//import * as boardFunctions from './boardFunctions.js';


app.get('/GetValues', function (req, res, next) {
    res.send(JSON.stringify(boardFunctions.getStoreRec()));
});

app.get('/ClearLog', function (req, res, next) {
    boardFunctions.clearLog();
    res.send(JSON.stringify(boardFunctions.getStoreRec()));
});

app.post('/UpdateConfig', function (req, res, next) {
    boardFunctions.updateConfig(req.body);
    res.send(JSON.stringify(boardFunctions.getStoreRec()));
});

app.post('/Water', function (req, res, next) {
    boardFunctions.water(req.body);
    res.send('ok');
});
