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
2018-01-14 JJK  Got moisture sensor working and sending data to emoncms
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
var nextSendMsTempature = 0;
var nextSendMsMoisture = 0;
var relays = null;

var relayOFF = true;

// When running Johnny-Five programs as a sub-process (eg. init.d, or npm scripts), 
// be sure to shut the REPL off!
var five = require("johnny-five");
var board = new five.Board({
  repl: false,
  debug: false,
});

board.on('ready', function () {
    console.log("board is ready");

    var moistureSensor = new five.Sensor({
      pin: 'A0',
      freq: 1000
    })

    /*
    moistureSensor.on('change', function (value) {
      // max seems to be 660  (maybe because the sensor's maximum output is 2.3V )
      // and the Arduino sensor measure from 0 to 5V (for 0 to 1024 values)
        console.log(dateTime.create().format('Y-m-d H:M:S')+", moisture = "+value);
    })
    */

    //type: "NO"  // Normally open - electricity not flowing - normally OFF
    relays = new five.Relays([{
      pin: 10, 
      type: "NO",
    }, {
      pin: 11, 
      type: "NO",
    }, {
      pin: 12, 
      type: "NO",
    }, {
      pin: 13, 
      type: "NO",
    }]);

    // Close the relay on pin 10.
    //relays[0].close();
    //relays[0].open();
    relays.off();


    // Scale the sensor's data from 0-1023 to 0-10 and log changes
    moistureSensor.on("change", function() {
      var currMs = Date.now();
      if (currMs > nextSendMsMoisture) {

        /*
        if (relayOFF) {
          console.log("Turning relay 10 ON");
          relays[0].on();
          relayOFF = false;
        } else {
          console.log("Turning relay 10 OFF");
          relays[0].off();
          relayOFF = true;
        }
        */

        // this shows "6" when in water 100% (660 because 2.3v of the 5.0v max - 1024)
        //console.log(dateTime.create().format('Y-m-d H:M:S')+", moisture = "+this.scaleTo(0, 10)+", this = "+this.value);

        var sURL = EMONCMS_INPUT_URL + "&json={moisture:" + this.value + "}";
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
      
        nextSendMsMoisture = currMs + intVal;
      }
    });

    // This requires OneWire support using the ConfigurableFirmata
    var thermometer = new five.Thermometer({
        controller: "DS18B20",
        pin: 2
    });

    thermometer.on("change", function() {
        var currMs = Date.now();
        //console.log(dateTime.create().format('Y-m-d H:M:S')+", "+this.fahrenheit + "°F");
        if (currMs > nextSendMsTempature) {
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
          
          nextSendMsTempature = currMs + intVal;
        }
    });

    console.log("end of board.on");
});

/*
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
    //relays[0].close();
    //relays[0].close();
    //relays[0].close();
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


  ws.on('message', function (message) {
    console.log('received from client: %s', message)
  })


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

*/