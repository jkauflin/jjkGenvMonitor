/*==============================================================================
(C) Copyright 2018,2019,2022,2023 John J Kauflin, All rights reserved. 
-----------------------------------------------------------------------------
DESCRIPTION: Main nodejs server to run the web and control functions for
                the grow environment monitor
                DESCRIPTION: NodeJS module to handle board functions.  Communicates with
             the Arduino Mega board using johnny-five library

-----------------------------------------------------------------------------
Modification History
2018-01-06 JJK  Initial version
2017-12-26 JJK  Got working as a systemd service on BBB after upgrading
                to BBB Debian 9.3 and NodeJS 6.12
2018-03-07 JJK  Moved board functions to boardFunctions
2018-03-21 JJK  Working on moisture and water control
2018-05-18 JJK  Modified to present and allow configuration updates from
                the web page
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
2018-06-18 JJK  Added lightDuration to store rec
2018-08-19 JJK  Turned off camera, added important dates and description
2018-09-30 JJK  Turned metrics back on to track tempature
2019-09-08 JJK  Upgraded to Raspbian Buster and NodeJS v10
2019-09-28 JJK  Re-implementing web display and updates to config values
2022-04-03 JJK  Updating to ES6 and bootstrap 5
2022-04-09 JJK  Hold off on ES6 for now, just implement bootstrap 5
2022-05-16 JJK  Re-checked update functions using Fetch POST w-JSON object
2022-09-06 JJK  Updated to use Raspberry Pi only without Arduino
2022-09-24 JJK  Going back to Arduino for relay functions, getting back
                into production
2022-04-09 JJK  Updated to use newest version of node-fetch
                >>>>> hold off for now, v3 has breaking changes for ES6
                went back to v2 for now
2022-04-12 JJK  Working on error handling - implementing a overall try/catch
                for the main executable code
2022-04-16 JJK  Checking function of file storage updates
2022-05-16 JJK  Get to gracefully work with board not plugged in - already
                working that way - error about serialport but runs rest
2022-06-18 JJK  Testing pi-io library for the Raspberry Pi
2022-09-06 JJK  Updated to use pigpio and onoff to control relays directly
                from the Raspberry pi.  Also using the Pi overlay for 
                1-wire control of the temperature sensor, and just reading
                values from the overlay file
2022-09-08 JJK  Back to johnny-five and arduino.  Raspberry pi GPIO (3.3v)
                does no have enough power to trigger the larger solid state 
                relays I am using.  Going back to johnny-five and arduino for 
                controlling the relays (still using Pi for temperature sensor)
2022-09-24 JJK  Working to get back into production
2023-07-11 JJK  Adjusted storage record values to match important dates
                for grow cycle and added auto-calculation of date values
2023-09-06 JJK  Use heatDurationMax for "watering interval" hours, and do
                the watering on that interval
-----------------------------------------------------------------------------
2023-09-08 JJK  Version 3 converting to ES6 modules and interacting with
                a backend database instead of running a webserver and 
                saving JSON in a file
                (In one day I figured out all the ES6 problems that were
                  bothering me - libraries written for CommonJS, importing
                  from NPM libraries, and import from my modules)
=============================================================================*/

import 'dotenv/config'
import fs, { readFileSync } from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
import { Buffer } from 'node:buffer'
import fetch from 'node-fetch'
import johnnyFivePkg from 'johnny-five'

import {log} from './util.mjs'
import {getConfig} from './dataRepository.mjs'

const {Board,Led,Relays} = johnnyFivePkg

// General handler for any uncaught exceptions
process.on('uncaughtException', function (e) {
  log("UncaughtException, error = " + e);
  console.error(e.stack);
  // Stop the process
  // 2017-12-29 JJK - Don't stop for now, just log the error
  //process.exit(1);
});


/*
const board = new Board();
var relays = new Relays([10, 11, 12, 13])
board.on("ready", () => {
  // Create an Led on pin 13
  const led = new Led(13);
  // Blink every half second
  led.blink(500);
});
*/

/*
fs.readFileSync = () => Buffer.from('Hello, ESM');
syncBuiltinESMExports();
fs.readFileSync === readFileSync; 
*/

// Global variables
const EMONCMS_INPUT_URL = process.env.EMONCMS_INPUT_URL
var emoncmsUrl = ""
var metricJSON = ""

var configCheckInterval = 10 * 1000
var metricInterval = 10 * 1000
const minutesToMilliseconds = 60 * 1000
const hoursToMilliseconds = 60 * 60 * 1000
const secondsToMilliseconds = 1000

/*
var currTemperature = sr.targetTemperature
var TEMPATURE_MAX = sr.targetTemperature + 1.0
var TEMPATURE_MIN = sr.targetTemperature - 1.0
*/

log(">>> Starting server.mjs...")


triggerConfigQuery()
function triggerConfigQuery() {
    log("Triggering queryConfig, configCheckInterval = "+configCheckInterval)

    getConfig().then(sr => {
        configCheckInterval = parseInt(sr.ConfigCheckInterval) * 1000
        metricInterval = parseInt(sr.LogMetricInterval) * 1000

        setTimeout(triggerConfigQuery, configCheckInterval)
    })
    .catch(err => {
        //log("in Main, err = "+err)
        setTimeout(triggerConfigQuery, configCheckInterval)
    })

    //ConfigCheckInterval  20
    //LogMetricInterval    10

}



var relays = null
const LIGHTS = 0
const WATER = 1
const AIR = 2
const HEAT = 3
const relayNames = ["lights", "water", "air",  "heat"]
const relayMetricON = 71
const relayMetricOFF = relayMetricON-1
const relayMetricValues = [relayMetricOFF,relayMetricOFF,relayMetricOFF,relayMetricOFF]

const OFF = 0
const ON = 1
var currAirVal = OFF
var currHeatVal = OFF
var currLightsVal = OFF
var date
var hours = 0
var airTimeout = 1.0
var heatTimeout = 1.0
var heatDurationMaxAdj = 0.5

// Library to control the Arduino board
var five = require("johnny-five")
var board = null
// Create Johnny-Five board object
// When running Johnny-Five programs as a sub-process (eg. init.d, or npm scripts), 
// be sure to shut the REPL off!
try {
    log("===== Starting board initialization =====");
    board = new five.Board({
        repl: false,
        debug: false
        //    timeout: 12000
    })

    // Get values from the application storage record
    log("===== Reading storage record =====")
    store.load(storeId, function(err, inStoreRec){
        if (err) {
            // Create one if it does not exist (with initial values)
            store.add(initStoreRec, function (err) {
                if (err) {
                    throw err
                }
            });
        } else {
            // Get current values from the store record
            sr = inStoreRec;
        }
    });

} catch (err) {
    log('Error in main initialization, err = '+err)
    console.error(err.stack)
}

board.on("error", function (err) {
    log("*** Error in Board ***")
    console.error(err.stack)
    boardReady = false
}); // board.on("error", function() {

//-------------------------------------------------------------------------------------------------------
// When the board is ready, create and intialize global component objects (to be used by functions)
//-------------------------------------------------------------------------------------------------------
board.on("ready", function () {
    log("*** board ready ***")

    // If the board is exiting, turn all the relays off
    this.on("exit", function () {
        log("on EXIT")
        turnRelaysOFF()
    })

    // Handle a termination signal (from stopping the systemd service)
    process.on('SIGTERM', function () {
        log('on SIGTERM')
        turnRelaysOFF()
    })

    log("Initializing relays")
    relays = new five.Relays([10, 11, 12, 13])
    // Ground is plugged into 14

    // Start the function to toggle air ventilation ON and OFF
    log("Starting Air toggle interval")
    setTimeout(toggleAir, 5000)
    // Start the function to toggle heat ON and OFF
    log("Starting Heat toggle interval")
    setTimeout(toggleHeat, 6000)

    // Start sending metrics 10 seconds after starting (so things are calm)
    setTimeout(logMetric, 10000)

    // Trigger the watering on the watering interval (using heatDurationMax for watering interval right now)
    setTimeout(triggerWatering,sr.heatDurationMax * hoursToMilliseconds)

    log("End of board.on (initialize) event")
    
}); // board.on("ready", function() {

function triggerWatering() {
    // Water the plant for the set water duration seconds
    log(">>> Starting to water the plants, interval hours = "+sr.heatDurationMax)
    setTimeout(waterThePlants, 500)

    // Recursively call the function with the watering interval
    setTimeout(triggerWatering,sr.heatDurationMax * hoursToMilliseconds)
}

function turnRelaysOFF() {
    log("Setting relays OFF")
    setRelay(LIGHTS, OFF)
    setRelay(AIR, OFF)
    setRelay(HEAT, OFF)
    setRelay(WATER, OFF)
}

function setRelay(relayNum, relayVal) {
    if (relayVal) {
        // If value is 1 or true, set the relay to turn ON and let the electricity flow
        //relays[relayNum].on()
        relays[relayNum].close()
        //log(relayNames[relayNum]+" ON close")
        //relayMetricValues[relayNum] = relayMetricON + (relayNum * 2)
        relayMetricValues[relayNum] = relayMetricON + relayNum
    } else {
        // If value is 0 or false, set the relay to turn OFF and stop the flow of electricity
        //relays[relayNum].off()
        relays[relayNum].open()
        //log(relayNames[relayNum]+" OFF open")
        relayMetricValues[relayNum] = relayMetricOFF
    }
}

// Function to toggle air ventilation ON and OFF
function toggleAir() {
    airTimeout = sr.airInterval

    if (currAirVal == OFF) {
        //log("Turning Air ON")
        setRelay(AIR,ON)
        currAirVal = ON
        airTimeout = sr.airDuration
    } else {
        //log("Turning Air OFF")
        setRelay(AIR,OFF)
        currAirVal = OFF
        airTimeout = sr.airInterval
    }

    // Check to turn the light on/off
    date = new Date()
    hours = date.getHours()
    //log("lightDuration = "+sr.lightDuration+", hours = "+hours)
    if (hours > (sr.lightDuration - 1)) {
        if (currLightsVal == ON) {
            setRelay(LIGHTS,OFF)
            currLightsVal = OFF
            heatDurationMaxAdj = 0.5  // Add a little extra heat max when the lights are off
        }
    } else {
        if (currLightsVal == OFF) {
            setRelay(LIGHTS,ON)
            currLightsVal = ON
            heatDurationMaxAdj = 0.0  // Don't add extra heat max when the lights are on
            // Take a selfie when you turn the lights on
            //setTimeout(letMeTakeASelfie, 100)
        }
    }

    // Recursively call the function with the current timeout value  
    setTimeout(toggleAir,airTimeout * minutesToMilliseconds)

} // function toggleAir() {

// Function to toggle air ventilation ON and OFF
function toggleHeat() {

    // 9/5/2023 - if needed, look more dynamic adjustment of heat duration and interval to get to target temp

    heatTimeout = sr.heatInterval

    if (currHeatVal == OFF) {
        //log("Turning Heat ON")
        setRelay(HEAT, ON)
        currHeatVal = ON
        heatTimeout = sr.heatDuration
    } else {
        //log("Turning Heat OFF")
        setRelay(HEAT, OFF)
        currHeatVal = OFF
        heatTimeout = sr.heatInterval
    }

    // Recursively call the function with the current timeout value  
    setTimeout(toggleHeat, heatTimeout * minutesToMilliseconds)

} // function toggleHeat() {

function getTemperature() {
    const oneWireOverlayTemperatureFile = "/sys/bus/w1/devices/28-0416b3494bff/temperature"
    fs.readFile(oneWireOverlayTemperatureFile, function (err, celsiusTemp) {
        if (err) {
            log("Error in reading temperature file")
        } else {
            currTemperature = ((celsiusTemp/1000) * (9/5)) + 32
            //log(`currTemperature = ${currTemperature}`)
        }
    });
}
    
// Send metric values to a website
function logMetric() {
    // Set the current temperature from the one-wire overlay file
    getTemperature()

    metricJSON = "{" + "tempature:" + currTemperature
        + ",heatDuration:" + sr.heatDuration
        + "," + relayNames[0] + ":" + relayMetricValues[0]
        + "," + relayNames[1] + ":" + relayMetricValues[1]
        + "," + relayNames[2] + ":" + relayMetricValues[2]
        + "," + relayNames[3] + ":" + relayMetricValues[3]
        + "}";
    //log(`metricJSON = ${metricJSON}`)
    emoncmsUrl = EMONCMS_INPUT_URL + "&json=" + metricJSON

    // Use this if we need to limit the send to between the hours of 6 and 20
    var date = new Date()
    var hours = date.getHours()

    fetch(emoncmsUrl)
    .then(checkResponseStatus)
    .catch(err => tempLogErr(err));

    // Set the next time the function will run
    setTimeout(logMetric, metricInterval)
}

function tempLogErr(err) {
    log("ERROR: "+err)
}

function checkResponseStatus(res) {
    if(res.ok){
        //log(`Fetch reponse is OK: ${res.status} (${res.statusText})`);
        return res
    } else {
        //throw new Error(`The HTTP status of the reponse: ${res.status} (${res.statusText})`)
        log(`Fetch reponse is NOT OK: ${res.status} (${res.statusText})`)
    }
}

function letMeTakeASelfie() {
  /*
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
  */
}

function waterThePlants() {
    log("Watering the plants, waterDuration = "+sr.waterDuration)
    setRelay(WATER,ON)
    setTimeout(() => {
        //log("Watering the plants OFF")
        setRelay(WATER,OFF)
    }, sr.waterDuration * secondsToMilliseconds)
}

function _waterOn(waterSeconds) {
    log("Turning Water ON, seconds = " + waterSeconds);
    setRelay(WATER, ON)
    setTimeout(() => {
        //log("Turning Water OFF")
        setRelay(WATER, OFF)
    }, waterSeconds * secondsToMilliseconds)
}

function getStoreRec() {
    return sr
}

function _saveStoreRec() {
    sr.id = storeId
    //sr.logList = logArray
    //log('Save JSON config record to storage file')
    store.add(sr, function (err) {
        if (err) {
            log("Error updating store rec, err = " + err)
        }
    });
}

function _addDays(inDate, days) {
    var td = new Date(inDate)
    td.setDate(td.getDate() + days)
    let tempMonth = td.getMonth() + 1
    let tempDay = td.getDate()
    let outDate = td.getFullYear() + '-' + paddy(tempMonth,2) + '-' + paddy(tempDay,2)
    return outDate;
}

function updateConfig(inStoreRec) {
    let prevPlantingDate = sr.plantingDate
    sr = inStoreRec

    // If the planting date changes, update the other dates based on the new date
    if (sr.plantingDate != prevPlantingDate) {
        sr.harvestDate = _addDays(sr.plantingDate,75)
        sr.cureDate = _addDays(sr.harvestDate,14)
        sr.productionDate = _addDays(sr.cureDate,14)
    }

    //log("updateConfig, targetTemperature = " + sr.targetTemperature)
    TEMPATURE_MAX = sr.targetTemperature + 1.0
    TEMPATURE_MIN = sr.targetTemperature - 1.0
    _saveStoreRec()
}

function clearLog() {
    logArray.length = 0
    _saveStoreRec()
}

function water(inRec) {
    //log(`in water, inRec.waterSeconds = ${inRec.waterSeconds}`)
    _waterOn(inRec.waterSeconds)
    return `Water turned on for ${inRec.waterSeconds} seconds`
}

