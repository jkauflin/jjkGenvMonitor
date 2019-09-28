/*==============================================================================
 * (C) Copyright 2017,2019 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Client-side JS functions and logic for web app
 *----------------------------------------------------------------------------
 * Modification History
 * 2017-09-08 JJK 	Initial version 
 * 2017-12-29 JJK	Initial controls and WebSocket communication
 * 2018-04-02 JJK   Added control to manually trigger watering
 * 2018-05-19 JJK  Added update of configuration store record values
 * 2018-06-18 JJK  Added lightDuration
 * 2018-08-19 JJK  Added description and dates
 * 2019-09-22 JJK  Getting it going again
 * 2019-09-28 JJK  Implemented modules concept and moved common methods to
 *                 util.js
 *============================================================================*/
var main = (function () {
    'use strict';

    //=================================================================================================================
    // Private variables for the Module
    var isTouchDevice = 'ontouchstart' in document.documentElement;

    var getDataService = "getResponses.php";
    var updateDataService = "updateResponses.php";
    var displayFields = ["id", "deleted", "keywords", "verbalResponse", "robotCommand", "score"];
    var editClass = "EditResponses";
    var searchStrName = "keywords";

    var storeRec = null;

    //=================================================================================================================
    // Variables cached from the DOM
    var $document = $(document);
    var $logMessage = $document.find("#logMessage");
    var $StatusDisplay = $document.find("#StatusDisplay");
    var $LookupButton = $document.find("#LookupButton");

    var $Inputs = $document.find("#InputValues");

    /*
    var $ModuleDiv = $('#ResponsesPage');
    var $SearchButton = $ModuleDiv.find("#SearchResponses");
    var $SearchStr = $ModuleDiv.find("#" + searchStrName);
    var $ClearButton = $ModuleDiv.find("#ClearResponses");
    var $ListDisplay = $ModuleDiv.find("#ResponsesListDisplay tbody");
    var $UpdateButton = $ModuleDiv.find("#UpdateResponses");
    */

    //=================================================================================================================
    // Bind events
    $LookupButton.click(_lookup);

    $SearchButton.click(_search);
    $ClearButton.click(_clear);
    $UpdateButton.click(_update);
    $ModuleDiv.on("click", "." + editClass, _edit);


	// Send updated values to the server (through web socket)
	$(document).on("click", "#UpdateButton", function () {
        
        /*
        storeRec.desc = $("#desc").val();
	    storeRec.germinationDate = $("#germinationDate").val();
	    storeRec.harvestDate = $("#harvestDate").val();
	    storeRec.cureDate = $("#cureDate").val();
	    storeRec.productionDate = $("#productionDate").val();
	    storeRec.targetTemperature = $("#targetTemperature").val();
	    storeRec.airInterval = $("#airInterval").val();
	    storeRec.airDuration = $("#airDuration").val();
	    storeRec.heatInterval = $("#heatInterval").val();
	    storeRec.heatDuration = $("#heatDuration").val();
	    storeRec.heatDurationMin = $("#heatDurationMin").val();
	    storeRec.heatDurationMax = $("#heatDurationMax").val();
	    storeRec.lightDuration = $("#lightDuration").val();
        storeRec.waterDuration = $("#waterDuration").val();
        */

        // POST storeRec

	    //wsSend('{"storeRec" : '+JSON.stringify(storeRec)+'}');
	});

	$("#LightsButton")
	    .mousedown(function () {
	        if (!isTouchDevice) {
	            lightsPushed();
	        }
	    })
	    .mouseup(function () {
	        if (!isTouchDevice) {
	            lightsReleased();
	        }
	    })
	    .on('touchstart', function () {
	        if (isTouchDevice) {
	            lightsPushed();
	        }
	    })
	    .on('touchend', function () {
	        if (isTouchDevice) {
	            lightsReleased();
	        }
	    });

	$("#Relay1Button")
	    .mousedown(function () {
	        if (!isTouchDevice) {
	            relay1Pushed();
	        }
	    })
	    .mouseup(function () {
	        if (!isTouchDevice) {
	            relay1Released();
	        }
	    })
	    .on('touchstart', function () {
	        if (isTouchDevice) {
	            relay1Pushed();
	        }
	    })
	    .on('touchend', function () {
	        if (isTouchDevice) {
	            relay1Released();
	        }
	    });

	$("#Relay2Button")
	    .mousedown(function () {
	        if (!isTouchDevice) {
	            relay2Pushed();
	        }
	    })
	    .mouseup(function () {
	        if (!isTouchDevice) {
	            relay2Released();
	        }
	    })
	    .on('touchstart', function () {
	        if (isTouchDevice) {
	            relay2Pushed();
	        }
	    })
	    .on('touchend', function () {
	        if (isTouchDevice) {
	            relay2Released();
	        }
	    });

	$("#Relay3Button")
	    .mousedown(function () {
	        if (!isTouchDevice) {
	            relay3Pushed();
	        }
	    })
	    .mouseup(function () {
	        if (!isTouchDevice) {
	            relay3Released();
	        }
	    })
	    .on('touchstart', function () {
	        if (isTouchDevice) {
	            relay3Pushed();
	        }
	    })
	    .on('touchend', function () {
	        if (isTouchDevice) {
	            relay3Released();
	        }
	    });

	$("#Relay4Button")
	    .mousedown(function () {
	        if (!isTouchDevice) {
	            relay4Pushed();
	        }
	    })
	    .mouseup(function () {
	        if (!isTouchDevice) {
	            relay4Released();
	        }
	    })
	    .on('touchstart', function () {
	        if (isTouchDevice) {
	            relay4Pushed();
	        }
	    })
	    .on('touchend', function () {
	        if (isTouchDevice) {
	            relay4Released();
	        }
	    });

	$("#SelfieButton")
	    .mousedown(function () {
	        if (!isTouchDevice) {
	            selfiePushed();
	        }
	    })
	    .on('touchstart', function () {
	        if (isTouchDevice) {
	            selfiePushed();
	        }
	    });



    //=================================================================================================================
    // Module methods
    function _lookup(event) {
        var jqxhr = $.getJSON("GetValues", "", function (storeRec) {
            $("#desc").val(storeRec.desc);
            $("#germinationDate").val(storeRec.germinationDate);
            $("#harvestDate").val(storeRec.harvestDate);
            $("#cureDate").val(storeRec.cureDate);
            $("#productionDate").val(storeRec.productionDate);
            $("#targetTemperature").val(storeRec.targetTemperature);
            $("#airInterval").val(storeRec.airInterval);
            $("#airDuration").val(storeRec.airDuration);
            $("#heatInterval").val(storeRec.heatInterval);
            $("#heatDuration").val(storeRec.heatDuration);
            $("#heatDurationMin").val(storeRec.heatDurationMin);
            $("#heatDurationMax").val(storeRec.heatDurationMax);
            $("#lightDuration").val(storeRec.lightDuration);
            $("#waterDuration").val(storeRec.waterDuration);
        }).fail(function (e) {
            console.log("Error getting environment variables");
        });
    }

    function _update(event) {
        var paramMap = null;
        //var paramMap = new Map();
        //paramMap.set('parcelId', event.target.getAttribute("data-Id"));
        //util.updateDataRecord(updateDataService, $Inputs, paramMap, displayFields, $ListDisplay, editClass);

        $.ajax("UpdateConfig", {
            type: "POST",
            contentType: "application/json",
            data: getJSONfromInputs($Inputs, paramMap),
            dataType: "json"
            //dataType: "html"
        })
        .done(function (response) {
            //Ajax request was successful.
            //$("#" + outDiv).html(response);

            // Render the list 
            displayList(displayFields, response, $ListDisplay, editClass);
            defaultCursor();
            clearInputs($Inputs);
        })
        .fail(function (xhr, status, error) {
            //Ajax request failed.
            console.log('Error in AJAX request to ' + url + ', xhr = ' + xhr.status + ': ' + xhr.statusText +
                ', status = ' + status + ', error = ' + error);
            alert('Error in AJAX request to ' + url + ', xhr = ' + xhr.status + ': ' + xhr.statusText +
                ', status = ' + status + ', error = ' + error);
        });
    }

    function _search(event) {
        util.searchDataDisplay(getDataService, searchStrName + "=" + $SearchStr.val(), displayFields, $ListDisplay, editClass);
    }

    function _clear(event) {
        util.clearInputs($Inputs);
    }

    function _edit(event) {
        util.editDataRecord(getDataService, "id=" + event.target.getAttribute("data-id"), $Inputs);
    }


    // General function to send the boardMessage to the server if Websocket is connected
    function wsSend(boardMessage) {
        //if (wsConnected) {
        //	ws.send(boardMessage);
        //}
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

    function selfiePushed() {
        wsSend('{"selfie" : 1}');
    }

    //=================================================================================================================
    // This is what is exposed from this Module
    return {};

})(); // var main = (function(){
