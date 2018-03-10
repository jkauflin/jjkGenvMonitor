/*==============================================================================
 * (C) Copyright 2017 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Client-side JS functions and logic for web app
 *----------------------------------------------------------------------------
 * Modification History
 * 2017-09-08 JJK 	Initial version 
 * 2017-12-29 JJK	Initial controls and WebSocket communication
 *============================================================================*/

// Global variables
var ws = null;
var wsConnected = false;
var isTouchDevice = false;
var date;

//Non-Printable characters - Hex 01 to 1F, and 7F
var nonPrintableCharsStr = "[\x01-\x1F\x7F]";
//"g" global so it does more than 1 substitution
var regexNonPrintableChars = new RegExp(nonPrintableCharsStr,"g");


function cleanStr(inStr) {
	return inStr.replace(regexNonPrintableChars,'');
}
function setCheckbox(checkVal){
	var checkedStr = '';
	if (checkVal == 1) {
		checkedStr = 'checked=true';
	}
	return '<input type="checkbox" data-mini="true" '+checkedStr+' disabled="disabled">';
}
$(document).ajaxError(function(e, xhr, settings, exception) {
	console.log("ajax exception = "+exception);
	console.log("ajax exception xhr.responseText = "+xhr.responseText);
	$(".ajaxError").html("An Error has occurred (see console log)");
	$("#StatusDisplay").html("An Error has occurred (see console log)");
});

function logMessage(message) {
	console.log(message);
	$("#logMessage").html(message);
}

$(document).ready(function(){
	isTouchDevice = 'ontouchstart' in document.documentElement;
	logMessage("isTouchDevice = "+isTouchDevice);

	// Auto-close the collapse menu after clicking a non-dropdown menu item (in the bootstrap nav header)
	$(document).on('click','.navbar-collapse.in',function(e) {
		if( $(e.target).is('a') && $(e.target).attr('class') != 'dropdown-toggle' ) {
				$(this).collapse('hide');
		}
	});

	// Using addClear plug-in function to add a clear button on input text fields
	$(".resetval").addClear();

	// Establish the websocket connection
	$.getJSON("start","",function(response){
		//console.log("response.wsUrl = "+response.wsUrl);
		ws = new WebSocket(response.wsUrl);
		// event emmited when connected
		ws.onopen = function () {
			wsConnected = true;
			//console.log('websocket is connected ...')
			// sending a send event to websocket server
			//ws.send('This is the message being sent from the client browser')
			$("#StatusDisplay").html("Connected");

			// event emmited when receiving message from the server
			ws.onmessage = function (messageEvent) {
				//console.log("on Message, messageEvent.data = "+messageEvent.data);
				var serverMessage = JSON.parse(messageEvent.data);
				if (serverMessage.errorMessage != null) {
					logMessage(serverMessage.errorMessage);
				}

				// add other board event handling here
				if (serverMessage.lightsVal != null) {
					$("#LightsDisplay").html("lightsVal = "+serverMessage.lightsVal);
					//$("#LightsDisplay").html("lightsVal = "+messageEvent.data);
				}
			} // on message (from server)

		} // Websocket open
	}); // start

	// Respond to the Search button click (because I can't figure out how to combine it with input change)
	$(document).on("click","#SearchButton",function(){
        //$("#PropertyListDisplay tbody").html("");
		console.log("searchStr = "+$("#searchStr").val());
    	//$.getJSON("testcall","searchStr="+cleanStr($("#searchStr").val()),function(response){
		/*
		$.get("testcall","searchStr="+cleanStr($("#searchStr").val()),function(response){
				console.log("response from SERVER in client = "+response);
    		//displayPropertyList(hoaPropertyRecList);
		});
		*/
		//ws.send($("#searchStr").val());
      event.stopPropagation();
  	});

	$("#LightsButton")
		.mousedown(function() {
			if (!isTouchDevice) { lightsPushed(); }
		})
		.mouseup(function() {
			if (!isTouchDevice) { lightsReleased(); }
		})
		.on('touchstart', function(){
			if (isTouchDevice) { lightsPushed(); }
		})
		.on('touchend', function(){
			if (isTouchDevice)  { lightsReleased(); }
	});

	$("#Relay1Button")
		.mousedown(function() {
			if (!isTouchDevice) { relay1Pushed(); }
		})
		.mouseup(function() {
			if (!isTouchDevice) { relay1Released(); }
		})
		.on('touchstart', function(){
			if (isTouchDevice) { relay1Pushed(); }
		})
		.on('touchend', function(){
			if (isTouchDevice)  { relay1Released(); }
	});

	$("#Relay2Button")
	.mousedown(function() {
		if (!isTouchDevice) { relay2Pushed(); }
	})
	.mouseup(function() {
		if (!isTouchDevice) { relay2Released(); }
	})
	.on('touchstart', function(){
		if (isTouchDevice) { relay2Pushed(); }
	})
	.on('touchend', function(){
		if (isTouchDevice)  { relay2Released(); }
	});

	$("#Relay3Button")
		.mousedown(function() {
			if (!isTouchDevice) { relay3Pushed(); }
		})
		.mouseup(function() {
			if (!isTouchDevice) { relay3Released(); }
		})
		.on('touchstart', function(){
			if (isTouchDevice) { relay3Pushed(); }
		})
		.on('touchend', function(){
			if (isTouchDevice)  { relay3Released(); }
	});

	$("#Relay4Button")
	.mousedown(function() {
		if (!isTouchDevice) { relay4Pushed(); }
	})
	.mouseup(function() {
		if (!isTouchDevice) { relay4Released(); }
	})
	.on('touchstart', function(){
		if (isTouchDevice) { relay4Pushed(); }
	})
	.on('touchend', function(){
		if (isTouchDevice)  { relay4Released(); }
});


}); // $(document).ready(function(){

// General function to send the boardMessage to the server if Websocket is connected
function wsSend(boardMessage) {
	if (wsConnected) {
		ws.send(boardMessage);
	}
}
	
function lightsPushed() {
	//console.log("Lights - Pushed");
	//$("#logMessage").html("Button - Pushed");
	wsSend('{"lights" : 1}');
}
function lightsReleased() {
	//console.log("Lights - Released");
	//$("#logMessage").html("Button - Released");
	wsSend('{"lights" : 0}');
}

function relay1Pushed() {
	wsSend('{"relay1" : 1}');
}
function relay1Released() {
	wsSend('{"relay1" : 0}');
}

function relay2Pushed() {
	wsSend('{"relay2" : 1}');
}
function relay2Released() {
	wsSend('{"relay2" : 0}');
}

function relay3Pushed() {
	wsSend('{"relay3" : 1}');
}
function relay3Released() {
	wsSend('{"relay3" : 0}');
}

function relay4Pushed() {
	wsSend('{"relay4" : 1}');
}
function relay4Released() {
	wsSend('{"relay4" : 0}');
}
