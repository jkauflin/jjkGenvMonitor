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
=============================================================================*/

import 'dotenv/config'

import fetch from 'node-fetch';
//const { Board, Led } = require("johnny-five");
//import {Board} from 'johnny-five';


//const mariadb = require('mariadb');
import mariadb from 'mariadb';
//const pool = mariadb.createPool({host: process.env.DB_HOST, user: process.env.DB_USER, connectionLimit: 5});
const pool = mariadb.createPool({host: process.env.DB_HOST, user: process.env.DB_USER, connectionLimit: 5});

async function asyncFunction() {
    let conn;
    try {
  
      conn = await pool.getConnection();
      const rows = await conn.query("SELECT 1 as val");
      // rows: [ {val: 1}, meta: ... ]
  
      const res = await conn.query("INSERT INTO myTable value (?, ?)", [1, "mariadb"]);
      // res: { affectedRows: 1, insertId: 1, warningStatus: 0 }
  
    } finally {
      if (conn) conn.release(); //release to pool
    }
  }

import johnnyFivePkg from 'johnny-five';
const {Board,Led,Relays} = johnnyFivePkg;

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

//const fs = require('fs')
import fs, { readFileSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { Buffer } from 'node:buffer';
fs.readFileSync = () => Buffer.from('Hello, ESM');
syncBuiltinESMExports();
fs.readFileSync === readFileSync; 

const EMONCMS_INPUT_URL = process.env.EMONCMS_INPUT_URL
const dbUser = process.env.TEST_DB_USER

// General handler for any uncaught exceptions
process.on('uncaughtException', function (e) {
    log("UncaughtException, error = " + e);
    console.error(e.stack);
    // Stop the process
    // 2017-12-29 JJK - Don't stop for now, just log the error
    //process.exit(1);
});

function paddy(num, padlen, padchar) {
    var pad_char = typeof padchar !== 'undefined' ? padchar : '0';
    var pad = new Array(1 + padlen).join(pad_char);
    return (pad + num).slice(-pad.length);
}
//var fu = paddy(14, 5); // 00014
//var bar = paddy(2, 4, '#'); // ###2

function log(inStr) {
    let td = new Date();
    let tempMonth = td.getMonth() + 1;
    let tempDay = td.getDate();
    let formattedDate = td.getFullYear() + '-' + paddy(tempMonth,2) + '-' + paddy(tempDay,2);
    var dateStr = `${formattedDate} ${paddy(td.getHours(),2)}:${paddy(td.getMinutes(),2)}:${paddy(td.getSeconds(),2)}.${td.getMilliseconds()}`;
    console.log(dateStr + " " + inStr);
}

/*
    "express": "^4.18.1",
    "json-fs-store": "^0.0.1",
    "node-fetch": "^2.6.7",
    "johnny-five": "^2.1.0"
*/

log(">>> Starting server.mjs...")
//log(`dbUser = ${dbUser}`)
