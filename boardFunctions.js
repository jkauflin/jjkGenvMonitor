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
2018-04-02 JJK  Added node-webcam to take photos of environment
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
  timeout: 25
});

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

var intervalSeconds = 30;
var intVal = intervalSeconds * 1000;
var nextSendMsTempature = 0;
var nextSendMsMoisture = 0;
var moistureSensor = null;
var thermometer = null;
var currMoisture = 0;
var currTemperature = 0.0;

var relays = null;
const LIGHTS = 0;
const AIR = 1;
const HEAT = 2;
const WATER = 3;
const relayNames = ["lights","air","heat","water"];
const OFF = 0;
const OFF_VALUE = 65;
const ON = 1;
const MOISTURE_WARNING = 999;
var currAirVal = OFF;
var currLightsVal = OFF;
var date;
var hours = 0;

// Value for air ventilation interval (check every 2 minutes - 2 minutes on, 2 minutes off) 
var airInterval = 2 * 60 * 1000;
//var airDuration = 2 * 60 * 1000;

var numReadings = 10;   // Total number of readings to average
var readingsA0 = [];    // Array of readings
var indexA0 = 0;        // the index of the current reading
var totalA0 = 0;        // the running total
var averageA0 = 0;      // the average

// initialize all the readings to 0:
for (var i = 0; i < numReadings; i++) {
    readingsA0[i] = 0;     
}

var arrayFull = false;

var readingsA1 = [];    // Array of readings
var indexA1 = 0;        // the index of the current reading
var totalA1 = 0;        // the running total
var averageA1 = 0;      // the average

// initialize all the readings to 0:
for (var i = 0; i < numReadings; i++) {
    readingsA1[i] = 0;     
}

var arrayFull2 = false;

// create EventEmitter object
var boardEvent = new EventEmitter();

board.on("error", function() {
  boardEvent.emit("error", "*** Error in Board ***");
}); // board.on("error", function() {

board.on("message", function(event) {
  console.log("Received a %s message, from %s, reporting: %s", event.type, event.class, event.message);
});

//-------------------------------------------------------------------------------------------------------
// When the board is ready, create and intialize global component objects (to be used by functions)
//-------------------------------------------------------------------------------------------------------
board.on("ready", function() {
  console.log("board is ready");


  this.wait(1000, function() {
  // This requires OneWire support using the ConfigurableFirmata
  console.log("Initialize tempature sensor");
  thermometer = new five.Thermometer({
    controller: "DS18B20",
    pin: 2
  });


    console.log("Declare on Thermometer change");
    thermometer.on("change", function() {
      //this.fahrenheit
  
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
          averageA0 = totalA0 / numReadings;        
      }
      
  
      var currMs = Date.now();
      //console.log(dateTime.create().format('Y-m-d H:M:S')+", "+this.fahrenheit + "°F");
      if (currMs > nextSendMsTempature && averageA0 > 60.0 && averageA0 < 135.0 && arrayFull) {
        //console.log(dateTime.create().format('Y-m-d H:M:S')+", "+averageA0 + "°F");
        currTemperature = averageA0;
        logMetric("tempature:"+averageA0);
        nextSendMsTempature = currMs + intVal;
      }
    });
  });


  console.log("Initialize moisture sensor");
  moistureSensor = new five.Sensor({
    pin: 'A0',
    freq: 1000
  })

  // Scale the sensor's data from 0-1023 to 0-10 and log changes
  moistureSensor.on("change", function() {
    // max seems to be 660  (maybe because the sensor's maximum output is 2.3V )
    // and the board sensor measure from 0 to 5V (for 0 to 1024 values)
    //console.log(dateTime.create().format('Y-m-d H:M:S')+", moisture = "+this.value);

    // subtract the last reading:
    totalA1 = totalA1 - readingsA1[indexA1];        
    readingsA1[indexA1] = this.value;
    // add the reading to the total:
    totalA1 = totalA1 + readingsA1[indexA1];      
    // advance to the next position in the array: 
    indexA1 = indexA1 + 1;                   
    // if we're at the end of the array...
    if (indexA1 >= numReadings) {             
      // ...wrap around to the beginning:
      indexA1 = 0;                       
      arrayFull2 = true;  
    }

    // calculate the average:
    if (arrayFull2) {
      averageA1 = totalA1 / numReadings;        
    }

    var currMs = Date.now();
    if (currMs > nextSendMsMoisture && arrayFull2) {
      // this shows "6" when in water 100% (660 because 2.3v of the 5.0v max - 1024)
      currMoisture = averageA1;
      logMetric("moisture:"+currMoisture);
      nextSendMsMoisture = currMs + intVal;

      if (currMoisture < MOISTURE_WARNING) {
        //log("Warning: LOW MOISTURE, curr = ",currMoisture);
      }
    }
  });

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

  // Turn all the relays off when the borard start (after a few seconds)
  this.wait(3000, function() {
    console.log("Setting relays OFF");
    setRelay(LIGHTS,OFF);
    setRelay(AIR,OFF);
    setRelay(HEAT,OFF);
    setRelay(WATER,OFF);

    // Start the function to toggle air ventilation ON and OFF
    //setTimeout(toggleAir,airInterval);
    console.log("Starting Air toggle interval");
    setInterval(toggleAir,airInterval);
  });

  // If the board is exiting, turn all the relays off
  this.on("exit", function() {
    console.log("Setting relays OFF");
    setRelay(LIGHTS,OFF);
    setRelay(AIR,OFF);
    setRelay(HEAT,OFF);
    setRelay(WATER,OFF);
  });

  console.log("end of board.on");
  console.log(" ");
}); // board.on("ready", function() {


// Function to toggle air ventilation ON and OFF
function toggleAir() {
  if (currAirVal == OFF) {
    setRelay(AIR,ON);
    //setRelay(HEAT,OFF);
    currAirVal = ON;
  } else {
    setRelay(AIR,OFF);
    //setRelay(HEAT,ON);
    currAirVal = OFF;
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
      letMeTakeASelfie();
    }
  }

} // function toggleAir() {

/*
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
*/

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
  */
 
  if (boardMessage.relay3 != null) {
    setRelay(HEAT,boardMessage.relay3);
  }
  if (boardMessage.relay4 != null) {
    setRelay(WATER,boardMessage.relay4);
  }

  if (boardMessage.selfie != null) {
    letMeTakeASelfie();
  }

} // function webControl(boardMessage) {

function setRelay(relayNum,relayVal) {
  if (relayVal) {
    // If value is 1 or true, set the relay to turn ON and let the electricity flow
    relays[relayNum].open();
    logMetric(relayNames[relayNum]+":"+(80+(relayNum*2)));
  } else {
    // If value is 0 or false, set the relay to turn OFF and stop the flow of electricity
    relays[relayNum].close();
    logMetric(relayNames[relayNum]+":"+OFF_VALUE);
  }
}

function letMeTakeASelfie() {
  // Turn on the light plugged into the HEAT relay
  setRelay(HEAT,ON);
  // Wait for the light to come on
  setTimeout(() => {
    //log("Taking a selfie","fswebcam capture");
    nodeWebcam.capture(process.env.IMAGES_DIR+"genvImage", nodewebcamOptions, function( err, data ) {
      //var image = "<img src='" + data + "'>";
      setRelay(HEAT,OFF);
    });
  }, 2000);

}

module.exports = {
    boardEvent,
    webControl
};

