/*==============================================================================
 * (C) Copyright 2017,2019,2021 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Client-side JS functions and logic for web app
 *----------------------------------------------------------------------------
 * Modification History
 * 2017-09-08 JJK 	Initial version 
 * 2017-12-29 JJK	Initial controls and WebSocket communication
 * 2018-04-02 JJK   Added control to manually trigger watering
 * 2018-05-19 JJK   Added update of configuration store record values
 * 2018-06-18 JJK   Added lightDuration
 * 2018-08-19 JJK   Added description and dates
 * 2019-09-22 JJK   Getting it going again
 * 2019-09-28 JJK   Implemented modules concept and moved common methods to
 *                  util.js
 * 2022-04-17 JJK   Making updates for bootstrap 5, and to use fetch()
 *                  instead of AJAX.  Removed old websocket stuff
 * 2022-05-19 JJK   Updated to use new util.fetchData and updateData functions
 *============================================================================*/
var main = (function () {
    'use strict';

    //=================================================================================================================
    // Private variables for the Module
    var isTouchDevice = 'ontouchstart' in document.documentElement;
    var storeRec = null;

    //=================================================================================================================
    // Variables cached from the DOM
    var $document = $(document);
    var $desc = $document.find("#desc");

    var $daysToGerm = $document.find("#daysToGerm");
    var $daysToBloom = $document.find("#daysToBloom");
    var $germinationStart = $document.find("#germinationStart");
    var $estBloomDate = $document.find("#estBloomDate");
    var $bloomDate = $document.find("#bloomDate");

    var $germinationDate = $document.find("#germinationDate");
    var $harvestDate = $document.find("#harvestDate");
    var $cureDate = $document.find("#cureDate");
    var $productionDate = $document.find("#productionDate");
    var $targetTemperature = $document.find("#targetTemperature");
    var $airInterval = $document.find("#airInterval");
    var $airDuration = $document.find("#airDuration");
    var $heatInterval = $document.find("#heatInterval");
    var $heatDuration = $document.find("#heatDuration");
    var $heatDurationMin = $document.find("#heatDurationMin");
    var $heatDurationMax = $document.find("#heatDurationMax");
    var $lightDuration = $document.find("#lightDuration");
    var $waterDuration = $document.find("#waterDuration");
    var $waterSeconds = $document.find("#waterSeconds");
    var $ClearLogButton = $document.find("#ClearLogButton");
    var $UpdateButton = $document.find("#UpdateButton");
    var $WaterButton = $document.find("#WaterButton");
    var $Inputs = $document.find("#InputValues");

    var $UpdateDisplay = $document.find("#UpdateDisplay");

    //var $altAddress = $moduleDiv.find("#altAddress");
    var $LogMessageDisplay = $("#LogMessageDisplay").find('tbody');

    //=================================================================================================================
    // Bind events
    $ClearLogButton.click(_clearLog);
    $UpdateButton.click(_update);
    $WaterButton.click(_water);
    _lookup();


    //=================================================================================================================
    // Module methods
    function _lookup(event) {
        util.fetchData('GetValues',true,$UpdateDisplay,_renderConfig);
    }

    function _update(event) {
        util.updateData('UpdateConfig',$Inputs,true,$UpdateDisplay,_renderConfig);
    }

    function _clearLog(event) {
        util.updateData('ClearLog',null,false,$UpdateDisplay);
    }

    function _water(event) {
        var paramMap = null;
        var paramMap = new Map();
        paramMap.set('waterSeconds', $waterSeconds.val());

        util.updateData("Water",null,false,$UpdateDisplay,null,paramMap);
    }

    function _renderConfig(storeRec) {
        if (storeRec != null) {
            $desc.val(storeRec.desc);
            $daysToGerm.val(storeRec.daysToGerm);
            $daysToBloom.val(storeRec.daysToBloom);
            $germinationStart.val(storeRec.germinationStart);
            $estBloomDate.val(storeRec.estBloomDate);
            $bloomDate.val(storeRec.bloomDate);
    
            $germinationDate.val(storeRec.germinationDate);
            $harvestDate.val(storeRec.harvestDate);
            $cureDate.val(storeRec.cureDate);
            $productionDate.val(storeRec.productionDate);
    
            $targetTemperature.val(storeRec.targetTemperature);
            $airInterval.val(storeRec.airInterval);
            $airDuration.val(storeRec.airDuration);
            $heatInterval.val(storeRec.heatInterval);
            $heatDuration.val(storeRec.heatDuration);
            $heatDurationMin.val(storeRec.heatDurationMin);
            $heatDurationMax.val(storeRec.heatDurationMax);
            $lightDuration.val(storeRec.lightDuration);
            $waterDuration.val(storeRec.waterDuration);
        }

        // loop through and add to a table
        /*
        var tr = '';
        $.each(storeRec.logList, function (index, logRec) {
            tr += '<tr class="small">';
            tr += '<td>' + logRec + '</td>';
            tr += '</tr>';
        });

        $LogMessageDisplay.html(tr);
        */
    }

    //=================================================================================================================
    // This is what is exposed from this Module
    return {};

})(); // var main = (function(){
