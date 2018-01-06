/*==============================================================================
(C) Copyright 2018 John J Kauflin, All rights reserved. 
-----------------------------------------------------------------------------
DESCRIPTION: Main nodejs server to run the web and control functions for
                the grow environment monitor
-----------------------------------------------------------------------------
Modification History
2018-01-06 JJK  Initial version
2017-12-26 JJK  Got working as a systemd service on BBB after upgrading
                to BBB Debian 9.3 and NodeJS 6.12
=============================================================================*/

// Read environment variables from the .env file
require('dotenv').config();

// General handler for any uncaught exceptions
process.on('uncaughtException', function (e) {
	console.log("UncaughtException, error = "+e);
	console.error(e.stack);
  // Stop the process
  // 2017-12-29 JJK - Don't stop for now, just log the error
	//process.exit(1);
});

const express = require('express');
const http = require('http');
const url = require('url');
var dateTime = require('node-datetime');
//var botFunctions = require('./botFunctions.js');
const get = require('simple-get')
var five = require('johnny-five');
var board = new five.Board();

//Non-Printable characters - Hex 01 to 1F, and 7F
const nonPrintableCharsStr = "[\x01-\x1F\x7F]";
//"g" global so it does more than 1 substitution
const regexNonPrintableChars = new RegExp(nonPrintableCharsStr,"g");
function cleanStr(inStr) {
	return inStr.replace(regexNonPrintableChars,'');
}

// Global variables
const EMONCMS_INPUT_URL = process.env.EMONCMS_INPUT_URL;

var intervalSeconds = 30;
var intVal = intervalSeconds * 1000;
var nextSendMs = 0;
board.on('ready', function () {
    console.log("board is ready");
    // This requires OneWire support using the ConfigurableFirmata
    var thermometer = new five.Thermometer({
        controller: "DS18B20",
        pin: 2
    });

    thermometer.on("change", function() {
        var currMs = Date.now();
        //console.log(dateTime.create().format('Y-m-d H:M:S')+", "+this.fahrenheit + "°F");
        if (currMs > nextSendMs) {
          //console.log(dateTime.create().format('Y-m-d H:M:S')+", "+this.fahrenheit + "°F");
          var sURL = EMONCMS_INPUT_URL + "&json={tempature:" + this.fahrenheit + "}";
          //console.log("sURL = "+sURL);
          // Send the data to the website
          get.concat(sURL, function (err, res, data) {
            //if (err) throw err
            if (err) {
              console.log("Error in tempature send, err = "+err);
            } else {
              //console.log(res.statusCode) // 200 
              //console.log(data) // Buffer('this is the server response') 
            }
          })
          nextSendMs = currMs + intVal;
        }
    });

    console.log("end of board.on");
});


var app = express();
var router = express.Router();
//var path = __dirname + '/views/';
var path = __dirname + '/';

//=================================================================================================
// D
//=================================================================================================
const ws = require('ws');
const wss = new ws.Server({ port: process.env.WS_PORT, perMessageDeflate: false });
// WebSocket URL to give to the client browser to establish ws connection
const wsUrl = "ws://"+process.env.HOST+":"+process.env.WS_PORT;

function heartbeat() {
  this.isAlive = true;
}

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    console.log(dateTime.create().format('Y-m-d H:M:S')+" In the ping, ws.readyState = "+ws.readyState);
    if (ws.isAlive === false) {
      return ws.terminate();
    }
    // Reset to false and request a ping (the pong response will set isAlive to true again)
    ws.isAlive = false;
    ws.ping('', false, true);
  });
}, 30000);

wss.on('connection', function (ws) {
  ws.isAlive = true;
  // If you get a pong response from a client call the heartbeat function to set a variable
  // showing the connection is still alive
  ws.on('pong', heartbeat);

  // Broadcast?
  /*
  wss.clients.forEach(function each(client) {
    if (client.readyState === ws.OPEN) {
      client.send(data);
    }
  });
  */

  ws.on('message', function (message) {
    console.log('received from client: %s', message)
  })

  // register event listener
  /*
  botFunctions.thermometerEvent.on("tempatureChange", function(fahrenheit) {
    // process data when someEvent occurs
    //console.log(dateTime.create().format('H:M:S.N')+" in Server, Tempature = "+fahrenheit + "°F");
    ws.send(fahrenheit);
  });
  */

})
  
app.get('/start', function (req, res, next) {
  //console.log("app.get /testcall, searchStr = "+req.query.searchStr);
  var startData = {
    "wsUrl": wsUrl
  };
  res.send(JSON.stringify(startData));
})
   
app.use(express.static('public'))
 
app.use("*",function(req,res){
  console.log("Not in Public, URL = "+req.url);
  res.sendFile(path + "404.html");
});

// jjk new
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})
 
app.listen(process.env.WEB_PORT,function(){
  //console.log("Live at Port "+process.env.WEB_PORT+" - Let's rock!");
});

