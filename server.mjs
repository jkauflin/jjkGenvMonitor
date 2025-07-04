/*==============================================================================
(C) Copyright 2018,2024,2025 John J Kauflin, All rights reserved. 
-----------------------------------------------------------------------------
DESCRIPTION: NodeJS module to handle board functions.  Communicates with
             the Arduino Mega board using johnny-five library.  Gets
             configuration values gives updates to a server database.
             Implements a web server for local admin functions.

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
2018-04-07 JJK  Added adjustment to cr.airDuration based on temperature (if it
                drops below 70 increase duration)
2018-04-14 JJK  Added toggleHeat and separate from air ventilation
2018-04-15 JJK  Modified to turn heat on when air goes off
2018-04-22 JJK  Working well with the Pi - check selfie and water timing
2018-05-14 JJK  Added store to save application configuration values
2018-05-18 JJK  Modified to accept configuration updates from web client
2018-06-18 JJK  Added cr.lightDuration to store rec
2018-08-19 JJK  Turned off camera, added important dates and description
2018-09-30 JJK  Turned metrics back on to track temperature
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
2023-09-06 JJK  Use cr.heatDurationMax for "watering interval" hours, and do
                the watering on that interval
-----------------------------------------------------------------------------
2023-09-08 JJK  Version 3 converting to ES6 modules and interacting with
                a backend database instead of running a webserver and 
                saving JSON in a file
                (In one day I figured out all the ES6 problems that were
                  bothering me - libraries written for CommonJS, importing
                  from NPM libraries, and import from my modules)
2023-09-15 JJK  Modified to read and update backend database for config
                values, and to handle WaterOn requests
2023-09-24 JJK  Added webcam functionality
2023-11-24 JJK  Modified to save multiple webcam pictures in a new table
2023-11-25 JJK  Modified to use LogMetricInterval as the minutes interval
                for taking and saving a Selfie
2023-12-10 JJK  Working on better automated adjustment of heat times to keep 
                close to target temperature
2024-01-03 JJK  Automated heat adjustment working well - turning log off.
                Implementing function to reboot the system after doing the
                scheduled watering (we'll see if that works ok and helps
                make the system more stable for longer periods of time)
2024-01-04 JJK  Reboot reported an error after but worked ok on the 
                UncaughtException.  Updating to use local device datetime
                when updating backend server
2024-01-06 JJK  Modified the DB functions to stop throwing errors (if the
                calling code is not going to do anything different)
2024-01-16 JJK  Added selfie re-try if webcam not found
2024-01-27 JJK  Re-adding Express web server for local admin web page, 
                which I will use in addition to back-end server DB 
                interactions, but for things that require immediate
                response, monitoring, or actions
2024-01-28 JJK  Implemented getDataSetParams with logic for setting light
                and water timing based on days from planting
2024-02-07 JJK  Implemented use of Config Record (cr) structure to keep
                local variables
2024-02-17 JJK  Got RequestCommand working again (added to cr and handling)
2024-02-18 JJK  Added switches for logging and images, and a next water
                to get water timing ok even if system reboots
2024-03-05 JJK  Modified to get configuration parameters from the .env and
                auto-calculation (don't count on the server DB for anything)
2024-12-22 JJK  Migration to Azure
2024-12-30 JJK  Got new Config, MetricPoint, and Image containers working
                and testing getting to target temperature
2025-01-27 JJK  Making adjustments to auto-calc logic and metrics logging
2025-03-24 JJK  Checking target temperature logic again
2025-04-02 JJK  Re-implementing target temp adjustment logic
2025-04-16 JJK  Checked base watering logic, and commented out logs
2025-05-28 JJK  Re-implementing auto-watering and command request logic
2025-06-07 JJK  Backing out command request logic - still don't have it right
2025-06-20 JJK  Modified to get id from env, and set notes
2025-07-04 JJK  Modifying to go back to datasource as primary record of 
                truth, adding stages to replace auto-calc, and changing
                update to use patch of specific fields instead of replace
=============================================================================*/

import 'dotenv/config'
import {exec} from 'child_process'          // Class to execute Linux commands
import fs, { readFileSync } from 'node:fs'
import crypto from 'node:crypto'
import { syncBuiltinESMExports } from 'node:module'
import { Buffer } from 'node:buffer'
import fetch from 'node-fetch'              // Fetch to make HTTPS calls
import johnnyFivePkg from 'johnny-five'     // Library to control the Arduino board
import nodeWebcamPkg from 'enhanced-node-webcam'
import {log,getDateStr,addDays,daysFromDate,getPointDay,getPointDayTime} from './util.mjs'
import {getServerDb,getLatestConfigId,logMetricToServerDb,insertImage} from './dataRepository.mjs'
import express from 'express';

const app = express();

const {Board,Led,Relays} = johnnyFivePkg

var webcamOptions = {
    width: 1280,
    height: 720,
    quality: 100,
    saveShots: false,
    output: "jpeg",
    callbackReturn: "base64",
    verbose: false
}
var webcam = nodeWebcamPkg.create(webcamOptions)

// General handler for any uncaught exceptions
process.on('uncaughtException', function (e) {
    log("UncaughtException, error = " + e)
    // if NOT RestError than print stack?
    //console.error(e.stack)
    
    // Try rebooting the system if there is an uncaught error 
    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> UN-COMMENT IF NEEDED <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    //setTimeout(rebootSystem, 5000)
})

// Global variables
const minutesToMilliseconds = 60 * 1000
const hoursToMilliseconds = 60 * 60 * 1000
const secondsToMilliseconds = 1000

const LIGHTS = 0
const WATER = 1
const AIR = 2
const HEAT = 3
const relayNames = ["lights", "water", "air", "heat"]
const relayMetricON = 71
const relayMetricOFF = relayMetricON - 1
const relayMetricValues = [relayMetricOFF, relayMetricOFF, relayMetricOFF, relayMetricOFF]

const OFF = 0
const ON = 1
var currAirVal = OFF
var currHeatVal = OFF
var currLightsVal = OFF

var waterDuration = 0
var waterInterval = 0
var lastWaterTs = '2099-01-01'
var lastWaterSecs = 0
var currTemperature = 0.0

var board = null
var relays = null

// Configuration parameters for operations (also stored in server database)
var cr

/*
    "s0day": 0,
    "s0waterDuration": 6,
    "s0waterInterval": 7,
    "s1day": 10,
    "s1waterDuration": 7,
    "s1waterInterval": 9,
    "s2day": 20,
    "s2waterDuration": 14,
    "s2waterInterval": 20,
    "s3day": 25,
    "s3waterDuration": 24,
    "s3waterInterval": 24,
    "s4day": 32,
    "s4waterDuration": 27,
    "s4waterInterval": 24,
    "s5day": 40,
    "s5waterDuration": 30,
    "s5waterInterval": 24,
    "s6day": 45,
    "s6waterDuration": 35,
    "s6waterInterval": 24,
*/

// Genv Metric Point
var gmp = {
    id: 'guid',
	PointDay: 20241225,
    PointDateTime: getDateStr(),
    //            YYhhMMss
    //              HH      needs to be 24-hr
    PointDayTime: 24125959,
    targetTemperature: parseFloat(process.env.targetTemperature),
    currTemperature: parseFloat(process.env.targetTemperature),
    airInterval: parseFloat(process.env.airInterval),
    airDuration: parseFloat(process.env.airDuration),
    heatInterval: parseFloat(process.env.heatInterval),
    heatDuration: parseFloat(process.env.heatDuration),

    lastWaterTs: getDateStr(),
    lastWaterSecs: 0

    //relayName0: relayNames[0],
    //relayMetricValue0: relayMetricValues[0],
    //relayName1: relayNames[1],
    //relayMetricValue1: relayMetricValues[1],
    //relayName2: relayNames[2],
    //relayMetricValue2: relayMetricValues[2],
    //relayName3: relayNames[3],
    //relayMetricValue3: relayMetricValues[3],
}


log(">>> Starting server.mjs...")
// Get parameter values from the server DB when the program starts
initConfigQuery()
async function initConfigQuery() {
    log("Initial Config Query")
    // Get latest config rec from the cloud datasource
    cr = await getLatestConfigId()
    getDataSetParams(cr)
}

// Create Johnny-Five board object
// When running Johnny-Five programs as a sub-process (eg. init.d, or npm scripts), 
// be sure to shut the REPL off!
try {
    log("===== Starting board initialization =====")
    board = new Board({
        repl: false,
        debug: false
        //    timeout: 12000
    })
} catch (err) {
    log('Error in main initialization, err = ' + err)
    console.error(err.stack)
}

board.on("error", function (err) {
    log("*** Error in Board ***")
    console.error(err.stack)
})

//-------------------------------------------------------------------------------------------------------
// When the board is ready, create and intialize global component objects (to be used by functions)
//-------------------------------------------------------------------------------------------------------
board.on("ready", () => {
    log("*** board ready ***")

    // If the board is exiting, turn all the relays off
    //this.on("exit", function () {
    //    log("on EXIT")
    //    turnRelaysOFF()
    //})
    // Handle a termination signal (from stopping the systemd service)
    process.on('SIGTERM', function () {
        log('on SIGTERM')
        turnRelaysOFF()
    })

    log("Initializing relays")
    relays = new Relays([10, 11, 12, 13])
    // Ground is plugged into 14

    // Start the function to toggle air ventilation ON and OFF
    log("Starting Air toggle interval")
    setTimeout(toggleAir, 5000)
    // Start the function to toggle heat ON and OFF
    log("Starting Heat toggle interval")
    setTimeout(toggleHeat, 6000)

    //log("Triggering Server DB update")
    //setTimeout(triggerUpdServerDb, 8000)

    // Start sending metrics X seconds after starting (so things are calm)
    setTimeout(logMetric, 8000)

    // Trigger the next watering based on the watering interval and last watering timestamp
    //setTimeout(triggerWatering, cr.waterInterval * hoursToMilliseconds)
    let tempMs = msToNextWatering(lastWaterTs,waterInterval)
    setTimeout(triggerWatering, tempMs)

    log("Triggering Selfie interval")
    setTimeout(triggerSelfie, 9000)
    _letMeTakeASelfie()
   
    log("End of board.on (initialize) event")
})


// Function to set light and water parameters based on the days from Planting Date
async function getDataSetParams(cr) {
    // Get the Cosmos DB item for cr
    cr = await getServerDb(cr)
    //log("Successful get of CR record from cloud datasource")

    let days = daysFromDate(cr.plantingDate)
    //log(">>> Set stage-watering, Days from PlantingDate = "+days)

    // Set the values for Stage 0 (germination), but after planting count on un-plugging the water 
    // and doing manual misting until the sprout is strong enough (about 7 to 10 days)

    if (days >= cr.s6day) {
        waterDuration = cr.s6waterDuration
        waterInterval = cr.s6waterInterval
    } else if (days >= cr.s5day) {
        waterDuration = cr.s5waterDuration
        waterInterval = cr.s5waterInterval
    } else if (days >= cr.s4day) {
        waterDuration = cr.s4waterDuration
        waterInterval = cr.s4waterInterval
    } else if (days >= cr.s3day) {
        waterDuration = cr.s3waterDuration
        waterInterval = cr.s3waterInterval
    } else if (days >= cr.s2day) {
        waterDuration = cr.s2waterDuration
        waterInterval = cr.s2waterInterval
    } else if (days >= cr.s1day) {
        waterDuration = cr.s1waterDuration
        waterInterval = cr.s1waterInterval
    } else {
        // Values for Germination (Stage 0)
        //waterDuration = 7
        //waterInterval = 6
        waterDuration = cr.s0waterDuration
        waterInterval = cr.s0waterInterval
    }

    return cr
}

function msToNextWatering(lastWaterTs,waterInterval) {
    let date1 = new Date(lastWaterTs);
    let date2 = new Date();
    let msSinceLastWatering = date2.getTime() - date1.getTime();
    let msToNext = (waterInterval * hoursToMilliseconds) - msSinceLastWatering
    if (msToNext < 5000) {
        msToNext = 5000
    }

    return msToNext
}

/*
async function triggerUpdServerDb() {
    //log("Triggering updServerDb, cr.configCheckInterval = "+cr.configCheckInterval)

    // If turned on, calculate the auto-set values before doing an update
    //if (cr.autoSetOn) {
        getDataSetParams(cr)
    //}

    // Get the Cosmos DB item for cr
    let dbCr = await getServerDb(cr)

    //------------------------------------------------------------------------------------
    // Handle requests
    //------------------------------------------------------------------------------------
    if (dbCr != null && dbCr.requestCommand != null && dbCr.requestCommand != "") {
        //log("dbCr.requestCommand = "+dbCr.requestCommand)
        cr.requestResult = ""
        if (dbCr.requestCommand == "WaterOn") {
            let waterSeconds = parseInt(dbCr.requestValue)
            _waterOn(waterSeconds)
            cr.requestCommand = ""
            cr.requestValue = ""
            cr.requestResult = "Water turned on for "+waterSeconds+" secs"
        } else if (dbCr.requestCommand == "SetAutoSetOn") {
            cr.autoSetOn = parseInt(dbCr.requestValue)
            cr.requestCommand = ""
            cr.requestValue = ""
            cr.requestResult = "autoSetOn set to "+cr.autoSetOn
        } else if (dbCr.requestCommand == "TakeSelfie") {
            _letMeTakeASelfie()
            cr.requestCommand = ""
            cr.requestValue = ""
            cr.requestResult = "Selfie taken "
        } else if (dbCr.requestCommand == "WaterDuration") {
            cr.waterDuration = parseInt(dbCr.requestValue)
            cr.requestCommand = ""
            cr.requestValue = ""
            cr.requestResult = "waterDuration set to "+cr.waterDuration
        } else if (dbCr.requestCommand == "WaterInterval") {
            cr.waterInterval = parseInt(dbCr.requestValue)
            cr.requestCommand = ""
            cr.requestValue = ""
            cr.requestResult = "waterInterval set to "+cr.waterInterval
        } else if (dbCr.requestCommand == "REBOOT") {
            cr.requestCommand = ""
            cr.requestValue = ""
            cr.requestResult = "Initiating REBOOT... "
            await updServerDb(cr)
            rebootSystem()
        } 
        //log(cr.requestResult)
    }

    // Set the current values into the backend server data store
    updServerDb(cr)
    // Set the next time to check the update
    setTimeout(triggerUpdServerDb, cr.configCheckInterval * secondsToMilliseconds)
}
*/

function _letMeTakeASelfie() {
    //log("in letMeTakeASelfie")
    /*
    let lightsWereOFF = false
    if (currLightsVal == OFF) {
        lightsWereOFF = true
        // If the light were off, turn them on for the Selfie
        setRelay(LIGHTS,ON)
        currLightsVal = ON
    }
                // If the light were OFF, turn them back off
            if (lightsWereOFF) {
                setRelay(LIGHTS,OFF)
                currLightsVal = OFF
            }
    */
    if (currLightsVal == ON) {
        webcam.capture("temp",function(err, base64ImgData) {
            if (err != null) {
                //log("Error with webcam capture, "+err)
                // Re-try once after 20 seconds
                setTimeout(_selfieRetry, 20000)
            } else {
                //console.log("webcam base64ImgData = "+base64ImgData)
                insertImage(base64ImgData)
                webcam.clear()
            }
        })
    }
}

function _selfieRetry() {
    if (currLightsVal == ON) {
        webcam = nodeWebcamPkg.create(webcamOptions)
        webcam.capture("temp",function(err, base64ImgData) {
            if (err != null) {
                log("2nd Selfie Try - Error with webcam capture, "+err)
            } else {
                //console.log("webcam base64ImgData = "+base64ImgData)
                insertImage(base64ImgData)
                webcam.clear()
            }
        })
    }
}

// Function to take a selfie image and store in database
function triggerSelfie() {
    if (cr.selfieOn) {
        _letMeTakeASelfie()
    }

    // Set the next time the function will run
    setTimeout(triggerSelfie, cr.logMetricInterval * minutesToMilliseconds)
}


function triggerWatering() {
    // Water the plant for the set water duration seconds
    //log(">>> Starting to water the plants ")
    setTimeout(waterThePlants, 500)

    // Recursively call the function with the watering interval
    setTimeout(triggerWatering, waterInterval * hoursToMilliseconds)
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
    let airTimeout = cr.airInterval

    if (currAirVal == OFF) {
        //log("Turning Air ON")
        setRelay(AIR,ON)
        currAirVal = ON
        airTimeout = cr.airDuration
    } else {
        //log("Turning Air OFF")
        setRelay(AIR,OFF)
        currAirVal = OFF
        airTimeout = cr.airInterval
    }

    // Check to turn the light on/off
    let date = new Date()
    let hours = date.getHours()
    //log("cr.lightDuration = "+cr.lightDuration+", hours = "+hours)
    if (hours > (cr.lightDuration - 1)) {
        if (currLightsVal == ON) {
            setRelay(LIGHTS,OFF)
            currLightsVal = OFF
        }
    } else {
        if (currLightsVal == OFF) {
            setRelay(LIGHTS,ON)
            currLightsVal = ON
        }
    }

    // Recursively call the function with the current timeout value  
    setTimeout(toggleAir,airTimeout * minutesToMilliseconds)

} // function toggleAir() {

// Function to toggle air ventilation ON and OFF
function toggleHeat() {
    let heatTimeout = 0.5               // Default timeout value
    let heatDurationAdjustment = 0.0    // Reset adjustment to zero before checking temperature
    let heatIntervalAdjustment = 0.0    // Reset adjustment to zero before checking temperature
    //let heatAdjustmentMax = 2.0
    //let heatAdjustmentMax = 0.2

    // Check the temperature and adjust the timeout values
    if (currTemperature > (cr.targetTemperature + 0.4)) {
        // Temperature is too HIGH - decrease the Duration
        heatDurationAdjustment = -0.3
        // If really too HIGH, increase the Interval
        if (currTemperature > (cr.targetTemperature + 1.0)) {
            heatIntervalAdjustment = 0.1
            heatDurationAdjustment = -0.4
        }
        if (currTemperature > (cr.targetTemperature + 1.5)) {
            heatIntervalAdjustment = 0.3
            heatDurationAdjustment = -0.5
        }
    }
    if (currTemperature < (cr.targetTemperature - 0.5)) {
        // Temperature is too LOW - increase the Duration
        heatDurationAdjustment = 0.4

        // If really too LOW, decrease the Interval
        if (currTemperature < (cr.targetTemperature - 1.0)) {
            heatIntervalAdjustment = -0.1
            heatDurationAdjustment = 0.5
        }
        if (currTemperature < (cr.targetTemperature - 1.5)) {
            heatIntervalAdjustment = -0.2
            heatDurationAdjustment = 0.7
        }

        if (currLightsVal == OFF) {
            // Add extra time to the Heat when the lights are OFF
            heatDurationAdjustment += 0.2
        }
    }

    if (currHeatVal == OFF) {
        //log("Turning Heat ON")
        setRelay(HEAT, ON)
        currHeatVal = ON
        //heatTimeout =  tempHeatDuration + heatDurationAdjustment
        heatTimeout =  cr.heatDuration + heatDurationAdjustment
    } else {
        //log("Turning Heat OFF")
        setRelay(HEAT, OFF)
        currHeatVal = OFF
        heatTimeout = cr.heatInterval + heatIntervalAdjustment
    }

    // if SOMETHING
    //log(`Heat:${currHeatVal} , target:${cr.targetTemperature}, curr:${currTemperature}, Timeout:${heatTimeout},  DurationAdj: ${heatDurationAdjustment}, IntervalAdj: ${heatIntervalAdjustment} `)

    // Recursively call the function with the current timeout value  
    setTimeout(toggleHeat, heatTimeout * minutesToMilliseconds)

} // function toggleHeat() {

function getTemperature() {
    const oneWireOverlayTemperatureFile = "/sys/bus/w1/devices/28-0416b3494bff/temperature"
    fs.readFile(oneWireOverlayTemperatureFile, function (err, celsiusTemp) {
        if (err) {
            log("Error in reading temperature file")
        } else {
            currTemperature = parseFloat((((celsiusTemp/1000) * (9/5)) + 32).toFixed(2)) 
            //log(`currTemperature = ${currTemperature}`)
        }
    })
}
    
// Send metric values to a website
function logMetric() {
    // Set the current temperature from the one-wire overlay file
    getTemperature()

    /*
    let metricJSON = "{" + "temperature:" + currTemperature
        + ",heatDuration:" + cr.heatDuration
        + "," + relayNames[0] + ":" + relayMetricValues[0]
        + "," + relayNames[1] + ":" + relayMetricValues[1]
        + "," + relayNames[2] + ":" + relayMetricValues[2]
        + "," + relayNames[3] + ":" + relayMetricValues[3]
        + "}";
    */
    // if SOMETHING
    //log(`metricJSON = ${metricJSON}`)

    if (cr.loggingOn) {
        let dateTimeStr = getDateStr()
        gmp.id = crypto.randomUUID()
        gmp.PointDay = getPointDay(dateTimeStr)
        gmp.PointDateTime = dateTimeStr
        gmp.PointDayTime = getPointDayTime(dateTimeStr)
        gmp.targetTemperature = cr.targetTemperature
        gmp.currTemperature = currTemperature
        gmp.airInterval = cr.airInterval
        gmp.airDuration = cr.airDuration
        gmp.heatInterval = cr.heatInterval
        gmp.heatDuration = cr.heatDuration

        gmp.lastWaterTs = lastWaterTs
        gmp.lastWaterSecs = lastWaterSecs

        //gmp.relayMetricValue0 = relayMetricValues[0]
        //gmp.relayMetricValue1 = relayMetricValues[1]
        //gmp.relayMetricValue2 = relayMetricValues[2]
        //gmp.relayMetricValue3 = relayMetricValues[3]
 
        logMetricToServerDb(gmp)
    }
   
    // Set the next time the function will run
    setTimeout(logMetric, cr.logMetricInterval * secondsToMilliseconds)
}

function waterThePlants() {
    //log(">>> Watering the plants, waterDuration = "+waterDuration)
    setRelay(WATER,ON)
    setTimeout(() => {
        log("Watering the plants OFF")
        setRelay(WATER,OFF)
        lastWaterTs = getDateStr()
        lastWaterSecs = waterDuration
    }, waterDuration * secondsToMilliseconds)
}

function _waterOn(waterSeconds) {
    //log("Turning Water ON, seconds = " + waterSeconds);
    setRelay(WATER, ON)
    setTimeout(() => {
        //log("Turning Water OFF")
        setRelay(WATER, OFF)
    }, waterSeconds * secondsToMilliseconds)
}

function rebootSystem() {
    log("***** Re-booting the System with sudo reboot ");
    let linuxCmd = 'sudo reboot'
    exec(linuxCmd, (err, stdout, stderr) => {
        log("AFTER exec "+linuxCmd)
        if (err) {
            console.error("Error during reboot command: "+err)
        }
    })
}

app.use(express.static('public'))
app.use(express.json())
app.listen(3035, function(err){
    if (err) console.log("*** Error in web server setup")
    console.log("Web Server listening on Port 3035");
})

app.get('/getConfigRec', function routeHandler(req, res) {
    res.json(cr)
})

/*
app.post('/updConfigRec', function routeHandler(req, res) {
    // update the params from web values
    cr.targetTemperature = parseFloat(req.body.targetTemperature)
    cr.configCheckInterval = parseInt(req.body.configCheckInterval)
    cr.heatInterval = parseFloat(req.body.heatInterval)
    cr.heatDuration = parseFloat(req.body.heatDuration)
    cr.waterDuration = parseFloat(req.body.waterDuration)
    cr.waterInterval = parseFloat(req.body.waterInterval)

    cr.loggingOn = parseInt(req.body.loggingOn)
    //log(`in Update, cr.loggingOn = ${cr.loggingOn}`)
    cr.selfieOn = parseInt(req.body.selfieOn)
    //log(`in Update, cr.selfieOn = ${cr.selfieOn}`)
    cr.autoSetOn = parseInt(req.body.autoSetOn)
    //log(`in Update, cr.selfieOn = ${cr.selfieOn}`)

    updServerDb(cr)

    res.json(cr)
})
*/

app.get('/genvGetSelfie', function routeHandler(req, res) {
    webcam = nodeWebcamPkg.create(webcamOptions)
    webcam.capture("temp",function(err, base64ImgData) {
        if (err != null) {
            res.status(400).send()
        } else {
            res.send(base64ImgData)
            webcam.clear()
        }
    })
    // get images and save to disk
    //saveImageToFile()
    //res.send()
})

app.post('/genvWaterOn', function routeHandler(req, res) {
    let waterSecs = parseInt(req.body.waterSeconds)
    _waterOn(waterSecs) 
    res.send(`Water turned ON for ${waterSecs} seconds`)
})

