/*==============================================================================
(C) Copyright 2018,2019 John J Kauflin, All rights reserved. 
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
=============================================================================*/

// Read environment variables from the .env file
require('dotenv').config();
//NODE_ENV=
//DEBUG=
//HOST=
//WEB_PORT=
//WS_PORT=
//EMONCMS_INPUT_URL=
//STORE_DIR=
//IMAGES_DIR=

var WEB_PORT = process.env.WEB_PORT;

// General handler for any uncaught exceptions
process.on('uncaughtException', function (e) {
  console.log("UncaughtException, error = " + e);
  console.error(e.stack);
  // Stop the process
  // 2017-12-29 JJK - Don't stop for now, just log the error
	//process.exit(1);
});

// Create a web server
const http = require('http');
const url = require('url');
var dateTime = require('node-datetime');
const express = require('express');
var app = express();
var httpServer = http.createServer(app);

app.use('/',express.static('public'));

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

app.get('/GetValues', function (req, res, next) {
    res.send(JSON.stringify(boardFunctions.getStoreRec()));
});

app.post('/UpdateConfig', function (req, res, next) {
    console.log("in the postTest, req.body = "+JSON.stringify(req.body));
    /*
    var array = req.body;
    console.log(array[0]["name"].toString());
    console.log(array[0]["value"].toString());
    console.log(array[1]["name"].toString());
    console.log(array[1]["value"].toString());
    res.send(JSON.stringify(req.body));
    */
});

/*
var bodyParser = require("body-parser");

// Turn off URL encoded and just use JSON
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
 
app.post('/postTest', function (req, res, next) {
  //console.log("in the postTest, req.body = "+JSON.stringify(req.body));
  var array = req.body;
  console.log(array[0]["name"].toString());
  console.log(array[0]["value"].toString());
  console.log(array[1]["name"].toString());
  console.log(array[1]["value"].toString());
  res.send(JSON.stringify(req.body));
});
*/

/*
// If they are set, get input parameters from the REQUEST
header("Content-Type: application/json; charset=UTF-8");#
Get JSON as a string
$json_str = file_get_contents('php://input');#
Get as an object
$param = json_decode($json_str);

//error_log(date('[Y-m-d H:i] '). '$sql = ' . $sql . PHP_EOL, 3, 'php.log');

$conn = getConn();

if ($param - > id == '') {
  if ($param - > deleted != 'Y' && $param - > keywords != '') {
    $stmt = $conn - > prepare("INSERT INTO responses (keywords,verbalResponse,robotCommand) VALUES (?,?,?); ");
    $stmt - > bind_param("sss", $param - > keywords, $param - > verbalResponse, $param - > robotCommand);
    $stmt - > execute();
    $stmt - > close();
  }
} else {
  if ($param - > deleted == "Y") {
    //$stmt = $conn->prepare("UPDATE responses SET deleted=?,lastChangedTs=CURRENT_TIMESTAMP WHERE id = ? ; ");
    //$stmt->bind_param("si",$param->deleted,$param->id);	
    $stmt = $conn - > prepare("DELETE FROM responses WHERE id = ? ; ");
    $stmt - > bind_param("i", $param - > id);
  } else {
    $stmt = $conn - > prepare("UPDATE responses SET deleted='N',keywords=?,verbalResponse=?,robotCommand=?,lastChangedTs=CURRENT_TIMESTAMP WHERE id = ? ; ");
    $stmt - > bind_param("sssi", $param - > keywords, $param - > verbalResponse, $param - > robotCommand, $param - > id);
  }
  $stmt - > execute();
  $stmt - > close();
}

$sql = "SELECT * FROM responses ";
$stmt = $conn - > prepare($sql);
$stmt - > execute();
$result = $stmt - > get_result();
$outputArray = array();
if ($result != NULL) {
  while ($row = $result - > fetch_assoc()) {
    array_push($outputArray, $row);
  }
}
$stmt - > close();

$conn - > close();

echo json_encode($outputArray);
*/