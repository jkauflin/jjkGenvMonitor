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
2018-03-13 JJK  Added logic to run lights for 18 hours
2018-03-25 JJK  Added logging of moisture sensor data
2018-03-26 JJK  Working on control of water relay
2018-03-29 JJK  Added 10 value arrays for smoothing
2018-03-31 JJK  Swapped the arduino and relays boards, and re-ordered the
                initialization sequence to solve the board timeout errors
2018-04-01 JJK  Working on initialization stability
                Doubled the board initialization timeout from 10 to 20 secs
                Added set relays OFF on exit
                Delay set of initial relays and air toggle
2018-04-02 JJK  Added node-webcam to take selfies of environment
                Added water for X seconds when lights are turned on
2018-04-05 JJK  Working on clean board initializations
                Removed moisture sensor (wasn't really giving good info)
2018-04-06 JJK  Re-working metrics logging to give consistent values to
                web ecomcms.
2018-04-07 JJK  Added adjustment to airDuration based on tempature (if it
                drops below 70 increase duration)
2018-04-14 JJK  Added toggleHeat and separate from air ventilation
2018-04-15 JJK  Modified to turn heat on when air goes off
2018-04-22 JJK  Working well with the Pi - check selfie and water timing
2018-05-14 JJK  Added store to save application configuration values
2018-05-18 JJK  Modified to accept configuration updates from web client
=============================================================================*/
var dateTime = require('node-datetime');
const get = require('simple-get')
const EventEmitter = require('events');
// When running Johnny-Five programs as a sub-process (eg. init.d, or npm scripts), 
// be sure to shut the REPL off!
var five = require("johnny-five");

// Set up the configuration store and initial values
var store = require('json-fs-store')(process.env.STORE_DIR);
var storeId = 'store';
var initStoreRec = {
  id: storeId,              // unique identifier
  targetTemperature: 72.0,  // degrees fahrenheit
  airInterval: 2,           // minutes
  airDuration: 2,           // minutes
  heatInterval: 1.5,        // minutes
  heatDuration: 1,          // minutes
  heatDurationMin: 1,       // minutes
  heatDurationMax: 1.5,     // minutes
  waterDuration: 7          // seconds
};
// Structure to hold current configuration values
var sr = initStoreRec;

// Get values from the application storage record
store.load(storeId, function(err, inStoreRec){
  if (err) {
    // Create one if it does not exist (with initial values)
    store.add(initStoreRec, function(err) {
      if (err) {
        throw err;
      }
    });
  } else {
    // Get current values from the store record
    sr = inStoreRec;
  }
});

// Requires webcam utility - sudo apt-get install fswebcam
var nodeWebcam = require( "node-webcam" );
//Default options 
var nodewebcamOptions = {
  //Picture related 
  width: 1280,
  height: 720,
  quality: 100,
  //Delay to take shot 
  delay: 0,
  //Save shots in memory 
  //saveShots: true,
  saveShots: false,
  // [jpeg, png] support varies 
  // Webcam.OutputTypes 
  output: "jpeg",
  //Which camera to use 
  //Use Webcam.list() for results 
  //false for default device 
  device: false,
  // [location, buffer, base64] 
  // Webcam.CallbackReturnTypes 
  callbackReturn: "location",
  //Logging 
  verbose: false
};

// Global variables
const development = process.env.NODE_ENV !== 'production';
const debug = process.env.DEBUG;
const EMONCMS_INPUT_URL = process.env.EMONCMS_INPUT_URL;
var emoncmsUrl = "";
var metricJSON = "";

var intervalSeconds = 30;
var intVal = intervalSeconds * 1000;
var currMs;
var nextSendMsTempature = 0;
var thermometer = null;
var currTemperature = sr.targetTemperature;
const TEMPATURE_MAX = sr.targetTemperature + 2.0;
const TEMPATURE_MIN = sr.targetTemperature - 2.0;

var relays = null;
const relayNames = ["lights","air","heat","water"];
const relayMetricON = 65;
const relayMetricOFF = 60;
const relayMetricValues = [relayMetricOFF,relayMetricOFF,relayMetricOFF,relayMetricOFF];
const LIGHTS = 0;
const AIR = 1;
const HEAT = 2;
const WATER = 3;
const OFF = 0;
const ON = 1;

const minutesToMilliseconds = 60 * 1000;
const secondsToMilliseconds = 1000;
var currAirVal = OFF;
var currHeatVal = OFF;
var currLightsVal = OFF;
var date;
var hours = 0;
var airTimeout = 1.0;

// Variables to hold sensor values
var numReadings = 10;   // Total number of readings to average
var readingsA0 = [];    // Array of readings
var indexA0 = 0;        // the index of the current reading
var totalA0 = 0;        // the running total
// initialize all the readings to 0:
for (var i = 0; i < numReadings; i++) {
    readingsA0[i] = 0;     
}
var arrayFull = false;

// Create EventEmitter object
var boardEvent = new EventEmitter();

// Create Johnny-Five board object
var board = new five.Board({
  repl: false,
  debug: true,
  timeout: 12000
});

board.on("error", function() {
  boardEvent.emit("error", "*** Error in Board ***");
}); // board.on("error", function() {

board.on("message", function(event) {
  console.log("Received a %s message, from %s, reporting: %s", event.type, event.class, event.message);
});

console.log("============ Starting board initialization ================");
//-------------------------------------------------------------------------------------------------------
// When the board is ready, create and intialize global component objects (to be used by functions)
//-------------------------------------------------------------------------------------------------------
board.on("ready", function() {
  console.log("board is ready");
  
  //type: "NO"  // Normally open - electricity not flowing - normally OFF
  console.log("Initialize relays");
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

  // Turn all the relays off when the borard starts
  this.wait(3000, function() {
    console.log("Setting relays OFF");
    setRelay(LIGHTS,OFF);
    setRelay(AIR,OFF);
    setRelay(HEAT,OFF);
    setRelay(WATER,OFF);

    // Start the function to toggle air ventilation ON and OFF
    console.log("Starting Air toggle interval");
    setTimeout(toggleAir,1000);
  });
  // If the board is exiting, turn all the relays off
  this.on("exit", function() {
    console.log("EXIT - Setting relays OFF");
    setRelay(LIGHTS,OFF);
    setRelay(AIR,OFF);
    setRelay(HEAT,OFF);
    setRelay(WATER,OFF);
  });

  // Define the thermometer sensor
  this.wait(5000, function() {
    // This requires OneWire support using the ConfigurableFirmata
    console.log("Initialize tempature sensor");
    thermometer = new five.Thermometer({
      controller: "DS18B20",
      pin: 2
    });

    thermometer.on("change", function() {
      // subtract the last reading:
      totalA0 = totalA0 - readingsA0[indexA0];        
      readingsA0[indexA0] = this.fahrenheit;
      // add the reading to the total:
      totalA0 = totalA0 + readingsA0[indexA0];      
      // advance to the next position in the array: 
      indexA0 = indexA0 + 1;                   
      // if we're at the end of the array...
      if (indexA0 >= numReadings) {             
        // ...wrap around to the beginning:
        indexA0 = 0;                       
        arrayFull = true;  
      }
      // calculate the average:
      if (arrayFull) {
        currTemperature = totalA0 / numReadings;        
      }

      // Check to adjust the duration of ventilation and heating according to tempature
      if (currTemperature < TEMPATURE_MIN) {
        sr.heatDuration = sr.heatDurationMax;
      }
      if (currTemperature > TEMPATURE_MAX) {
        sr.heatDuration = sr.heatDurationMin;
      }
  
      currMs = Date.now();
      //console.log("Tempature = "+this.fahrenheit + "°F");
      if (currMs > nextSendMsTempature && currTemperature > 60.0 && currTemperature < 135.0 && arrayFull) {
        setTimeout(logMetric);
        nextSendMsTempature = currMs + intVal;
      }
    }); // on termometer change
  });

  console.log("End of board.on (initialize) event");
  console.log(" ");
}); // board.on("ready", function() {


// Function to toggle air ventilation ON and OFF
function toggleAir() {
  airTimeout = sr.airInterval;

  if (currAirVal == OFF) {
    //console.log("Turning Air ON");
    setRelay(AIR,ON);
    currAirVal = ON;
    airTimeout = sr.airDuration;
  } else {
    //console.log("Turning Air OFF");
    setRelay(AIR,OFF);
    currAirVal = OFF;
    airTimeout = sr.airInterval;
    // When the air goes off, turn the heat on
    if (currHeatVal == OFF) {
      setTimeout(turnHeatOn,0);
    }
  }

  date = new Date();
  hours = date.getHours();
  if (hours > 17) {
    if (currLightsVal == ON) {
      setRelay(LIGHTS,OFF);
      currLightsVal = OFF;
    }
  } else {
    if (currLightsVal == OFF) {
      setRelay(LIGHTS,ON);
      currLightsVal = ON;
      // Take a selfie when you turn the lights on
      setTimeout(letMeTakeASelfie, 100);
      // Water the plants for a few seconds when the light come on
      setTimeout(waterThePlants, 500);
    }
  }

  // Recursively call the function with the current timeout value  
  setTimeout(toggleAir,airTimeout * minutesToMilliseconds);

} // function toggleAir() {

// Function to turn air ventilation in/heat ON
function turnHeatOn() {
  //console.log("Turning Heat ON");
  setRelay(HEAT,ON);
  currHeatVal = ON;
  // Queue up function to turn the heat back off after the duration time
  setTimeout(turnHeatOff,sr.heatDuration * minutesToMilliseconds);
}
// Function to turn air ventilation in/heat OFF
function turnHeatOff() {
  //console.log("Turning Heat OFF");
  setRelay(HEAT,OFF);
  currHeatVal = OFF;
}


function logMetric() {
  metricJSON = "{" + "tempature:"+currTemperature
      +",airDuration:"+sr.heatDuration
      +","+relayNames[0]+":"+relayMetricValues[0]
      +","+relayNames[1]+":"+relayMetricValues[1]
      +","+relayNames[2]+":"+relayMetricValues[2]
      +","+relayNames[3]+":"+relayMetricValues[3]
      +"}";
  emoncmsUrl = EMONCMS_INPUT_URL + "&json=" + metricJSON;

  get.concat(emoncmsUrl, function (err, res, data) {
    if (err) {
      //console.error("Error in logMetric send, metricJSON = "+metricJSON);
      //console.error("err = "+err);
    } else {
      //console.log(res.statusCode) // 200 
      //console.log(data) // Buffer('this is the server response') 
    }
  });
}

/*
function log(logId,logStr) {
  if (development && debug) {
    console.log(dateTime.create().format('H:M:S')+" "+logId+", "+logStr);
  }
}
*/

function webControl(boardMessage) {
  if (boardMessage.relay3 != null) {
    setRelay(HEAT,boardMessage.relay3);
  }
  if (boardMessage.relay4 != null) {
    //setRelay(WATER,boardMessage.relay4);
    if (boardMessage.relay4 == 1) {
      setTimeout(waterThePlants);
    }
  }

  if (boardMessage.selfie != null) {
    setTimeout(letMeTakeASelfie);
  }

  // If send a new store rec, replace the existing and store it to disk
  if (boardMessage.storeRec != null) {
    sr = boardMessage.storeRec;
    store.add(sr, function(err) {
      if (err) {
        //throw err;
        console.log("Error updating store rec, err = "+err);
      }
    });
  }

} // function webControl(boardMessage) {

function setRelay(relayNum,relayVal) {
  if (relayVal) {
    // If value is 1 or true, set the relay to turn ON and let the electricity flow
    relays[relayNum].open();
    //console.log(relayNames[relayNum]+" ON");
    relayMetricValues[relayNum] = relayMetricON+(relayNum*2);
  } else {
    // If value is 0 or false, set the relay to turn OFF and stop the flow of electricity
    relays[relayNum].close();
    //console.log(relayNames[relayNum]+" OFF");
    relayMetricValues[relayNum] = relayMetricOFF;
  }
  setTimeout(logMetric);
}

function letMeTakeASelfie() {
  setTimeout(() => {
    //console.log("Taking a selfie with fswebcam capture");
    // figure out how to save a weekly picture
    nodeWebcam.capture(process.env.IMAGES_DIR+"genvImage", nodewebcamOptions, function( err, data ) {
      if (err != null) {
        console.log("Error with webcam capture, err = "+err);
      }
      //var image = "<img src='" + data + "'>";
      //setRelay(HEAT,OFF);
    });
  }, 100);
}

function waterThePlants() {
  console.log("Watering the plants, waterDuration = "+sr.waterDuration);
  setRelay(WATER,ON);
  setTimeout(() => {
    //console.log("Watering the plants OFF");
    setRelay(WATER,OFF);
  }, sr.waterDuration * secondsToMilliseconds);
}

function getStoreRec () {
  return sr;
}

module.exports = {
    boardEvent,
    webControl,
    getStoreRec
};

