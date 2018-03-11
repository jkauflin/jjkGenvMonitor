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
2018-03-10 JJK  Testing production relays
2018-03-11 JJK  Adding emoncms logging of relay activity, and using 
                setTimeout to turn air ventiliation ON and OFF
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

// Global variables
const development = process.env.NODE_ENV !== 'production';
const debug = process.env.DEBUG;
const EMONCMS_INPUT_URL = process.env.EMONCMS_INPUT_URL;
var emoncmsUrl = "";

var intervalSeconds = 30;
var intVal = intervalSeconds * 1000;
var nextSendMsTempature = 0;
var nextSendMsMoisture = 0;
var moistureSensor = null;
var thermometer = null;

var relays = null;
const LIGHTS = 0;
const AIR = 1;
const HEAT = 2;
const WATER = 3;
const relayNames = ["lights","air","heat","water"];
const OFF = 0;
const ON = 1;
var currAirVal = OFF;

// Run the air ventilation for 1 minute, then wait for 5 minutes
var airInterval = 5 * 60 * 1000;
var airDuration = 1 * 60 * 1000;

// create EventEmitter object
var boardEvent = new EventEmitter();

board.on("error", function() {
  //console.log("*** Error in Board ***");
  boardEvent.emit("error", "*** Error in Board ***");
}); // board.on("error", function() {

//-------------------------------------------------------------------------------------------------------
// When the board is ready, create and intialize global component objects (to be used by functions)
//-------------------------------------------------------------------------------------------------------
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
 
  //relays.close();  // turn all the power OFF
  // for the Sunfounder relay, normal open, use OPEN to electrify the coil and allow electricity
  // use CLOSE to de-electrify the coil, and stop electricity
  // (a little backward according to Johnny-Five documentation)

  // Turn all the relays off when the borard start
  setRelay(LIGHTS,OFF);
  setRelay(AIR,OFF);
  setRelay(HEAT,OFF);
  setRelay(WATER,OFF);

  // Start the function to toggle air ventilation ON and OFF
  setTimeout(toggleAir,airInterval);

  // Scale the sensor's data from 0-1023 to 0-10 and log changes
  moistureSensor.on("change", function() {
    var currMs = Date.now();
    if (currMs > nextSendMsMoisture) {
      // this shows "6" when in water 100% (660 because 2.3v of the 5.0v max - 1024)
      logMetric("moisture:"+this.value);
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
        logMetric("tempature:"+this.fahrenheit);
        nextSendMsTempature = currMs + intVal;
      }
  });
 
  console.log("end of board.on");
}); // board.on("ready", function() {

// Function to toggle air ventilation ON and OFF
function toggleAir() {
  var timeoutMs = airInterval;
  if (currAirVal == OFF) {
    //log("testInterval","Turning ON");
    setRelay(AIR,ON);
    currAirVal = ON;
    timeoutMs = airDuration;
  } else {
    //log("testInterval","Turning OFF");
    setRelay(AIR,OFF);
    currAirVal = OFF;
    timeoutMs = airInterval;
  }

  // Recursively call the function with the current timeout value  
  setTimeout(toggleAir,timeoutMs);
}

function logMetric(metricJSON) {
  log("logMetric",metricJSON);
  emoncmsUrl = EMONCMS_INPUT_URL + "&json={" + metricJSON +"}";
  get.concat(emoncmsUrl, function (err, res, data) {
    if (err) {
      console.error("Error in logMetric send, metricJSON = "+metricJSON);
      console.error("err = "+err);
    } else {
      //console.log(res.statusCode) // 200 
      //console.log(data) // Buffer('this is the server response') 
    }
  });
}

function log(logId,logStr) {
  if (development && debug) {
    console.log(dateTime.create().format('H:M:S')+" "+logId+", "+logStr);
  }
}

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

  //if (boardMessage.lights != null) {
    //console.log("lights = "+boardMessage.lights);
    //boardEvent.emit("lightsVal",boardMessage.lights);
  //}

  /*
  if (boardMessage.relay1 != null) {
    setRelay(LIGHTS,boardMessage.relay1);
  }
  if (boardMessage.relay2 != null) {
    setRelay(AIR,boardMessage.relay2);
  }
  if (boardMessage.relay3 != null) {
    setRelay(HEAT,boardMessage.relay3);
  }
  if (boardMessage.relay4 != null) {
    setRelay(WATER,boardMessage.relay4);
  }
  */

} // function webControl(boardMessage) {

function setRelay(relayNum,relayVal) {
  if (relayVal) {
    // If value is 1 or true, set the relay to turn ON and let the electricity flow
    relays[relayNum].open();
    logMetric(relayNames[relayNum]+":"+(80+(relayNum*2)));
  } else {
    // If value is 0 or false, set the relay to turn OFF and stop the flow of electricity
    relays[relayNum].close();
    logMetric(relayNames[relayNum]+":0");
  }
}

module.exports = {
    boardEvent,
    webControl
};

