/*==============================================================================
(C) Copyright 2018 John J Kauflin, All rights reserved. 
-----------------------------------------------------------------------------
DESCRIPTION: NodeJS module to handle board functions.  Communicates with
             the Arduino Mega board
-----------------------------------------------------------------------------
Modification History
2018-01-06 JJK  Initial version
2018-01-14 JJK  Got moisture sensor working and sending data to emoncms
2018-03-06 JJK  Got relays working to control electric systems
=============================================================================*/
var dateTime = require('node-datetime');
const get = require('simple-get')
const EventEmitter = require('events');
// When running Johnny-Five programs as a sub-process (eg. init.d, or npm scripts), 
// be sure to shut the REPL off!
var five = require("johnny-five");
var board = new five.Board({
  repl: false,
  debug: false,
});
//var dt = dateTime.create();
//var formatted = dt.format('Y-m-d H:M:S');

// Global variables
const EMONCMS_INPUT_URL = process.env.EMONCMS_INPUT_URL;

var intervalSeconds = 30;
var intVal = intervalSeconds * 1000;
var nextSendMsTempature = 0;
var nextSendMsMoisture = 0;
var moistureSensor = null;
var thermometer = null;

var relays = null;
var relayOFF = true;
const RELAY_AIR = 0;
const RELAY_WATER = 1;
const RELAY_EARTH = 2;
const RELAY_FIRE = 3;

// create EventEmitter object
var boardEvent = new EventEmitter();

board.on("error", function() {
  //console.log("*** Error in Board ***");
  boardEvent.emit("error", "*** Error in Board ***");
}); // board.on("error", function() {
  

// When the board is ready, create and intialize global component objects (to be used by functions)
board.on("ready", function() {
  console.log("board is ready");
  
  moistureSensor = new five.Sensor({
    pin: 'A0',
    freq: 1000
  })

  /*
  moistureSensor.on('change', function (value) {
    // max seems to be 660  (maybe because the sensor's maximum output is 2.3V )
    // and the board sensor measure from 0 to 5V (for 0 to 1024 values)
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
        relays[RELAY_AIR].on();
        relayOFF = false;
      } else {
        console.log("Turning relay 10 OFF");
        relays[RELAY_AIR].off();
        relayOFF = true;
      }
      */

      // this shows "6" when in water 100% (660 because 2.3v of the 5.0v max - 1024)
      //console.log(dateTime.create().format('Y-m-d H:M:S')+", moisture = "+this.scaleTo(0, 10)+", this = "+this.value);

      var sURL = EMONCMS_INPUT_URL + "&json={moisture:" + this.value + "}";
      //console.log("sURL = "+sURL);
      // Send the data to the website
      
      /*
      get.concat(sURL, function (err, res, data) {
        //if (err) throw err
        if (err) {
          console.log("Error in tempature send, err = "+err);
        } else {
          //console.log(res.statusCode) // 200 
          //console.log(data) // Buffer('this is the server response') 
        }
      })
      */

      nextSendMsMoisture = currMs + intVal;
    }
  });

  // This requires OneWire support using the ConfigurableFirmata
  thermometer = new five.Thermometer({
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
}); // board.on("ready", function() {

function webControl(boardMessage) {
  /*
  if (boardMessage.motorSpeed != null) {
    motorSpeed = boardMessage.motorSpeed;
  }
  if (boardMessage.armPosition != null) {
    armAnimation.enqueue({
      duration: 500,
      cuePoints: [0, 1.0],
      keyFrames: [ {degrees: currArmPos}, {degrees: boardMessage.armPosition}]
    });
  }

  if (boardMessage.move != null) {
    if (boardMessage.moveDirection != null) {
      moveDirection = boardMessage.moveDirection;
    }
  */

  if (boardMessage.lights != null) {
    //console.log("lights = "+boardMessage.lights);
    boardEvent.emit("lightsVal",boardMessage.lights);
  }


} // function webControl(boardMessage) {

module.exports = {
    boardEvent,
    webControl
};

