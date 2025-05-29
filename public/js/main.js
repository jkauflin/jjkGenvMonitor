/*==============================================================================
 * (C) Copyright 2024 John J Kauflin, All rights reserved.
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
 * 2022-05-31 JJK   Updated to use newest fetch ideas for lookup and update,
 *                  and converted to use straight javascript
 * 2023-07-11 JJK   Got rid of util and converted util.getParamDatafromInputs
 *                  to simple paramData object create from inputs
 * --------------------------------------------------------------------------
 * 2024-01-27 JJK   Re-implemented local web and converted to ES6 module
 * 2024-02-03 JJK   Modified to keep a local Config Record as the source of
 *                  truth for operations and display, instead of the DB
 *                  storage record - which is used for storage and updates
 * 2024-02-18 JJK   Added switches for logging and images, and a next water
 *                  to get water timing ok even if system reboots
 * 2024-12-23 JJK   Migration to Azure and Cosmos DB NoSQL
 * 2025-05-28 JJK   Back-track updates from the backend website version
 * 2025-05-29 JJK   Added util and better fetch error handling
 *============================================================================*/

 import {showLoadingSpinner,empty,checkFetchResponse} from './util.js'

 var configDesc = document.getElementById("configDesc")
 var daysToGerm = document.getElementById("daysToGerm")
 var daysToBloom = document.getElementById("daysToBloom")
 var germinationStart = document.getElementById("germinationStart")
 var plantingDate = document.getElementById("plantingDate")
 var harvestDate = document.getElementById("harvestDate")
 var cureDate = document.getElementById("cureDate")
 var productionDate = document.getElementById("productionDate")
 var targetTemperature = document.getElementById("targetTemperature")
 var currTemperature = document.getElementById("currTemperature")
 var airInterval = document.getElementById("airInterval")
 var airDuration = document.getElementById("airDuration")
 var heatInterval = document.getElementById("heatInterval")
 var heatDuration = document.getElementById("heatDuration")
 var lightDuration =  document.getElementById("lightDuration")
 var waterInterval = document.getElementById("waterInterval")
 var waterDuration = document.getElementById("waterDuration")
 var lastWaterTs = document.getElementById("lastWaterTs")
 var lastWaterSecs = document.getElementById("lastWaterSecs")
 var configCheckInterval = document.getElementById("configCheckInterval")

 var lastUpdateTs = document.getElementById("lastUpdateTs")
 var messageDisplay = document.getElementById("MessageDisplay")
 var imgDisplay = document.getElementById("ImgDisplay")
 var returnMessage = document.getElementById("returnMessage")

 var getDataButton = document.getElementById("GetDataButton")
 var updateButton = document.getElementById("UpdateButton")
 var waterButton = document.getElementById("WaterButton")
 var GetSelfieButton = document.getElementById("GetSelfieButton")

 var loggingSwitch = document.getElementById("loggingSwitch")
 var imagesSwitch = document.getElementById("imagesSwitch")
 var autoSetSwitch = document.getElementById("autoSetSwitch")
 loggingSwitch.checked = false;
 imagesSwitch.checked = false;
 autoSetSwitch.checked = false;

 //=================================================================================================================
 // Bind events
 getDataButton.addEventListener("click", _lookup);
 updateButton.addEventListener("click", _update);
 waterButton.addEventListener("click", _water);
 GetSelfieButton.addEventListener("click", _getSelfie);


 //=================================================================================================================
 // Module methods
async function _lookup(event) {
    showLoadingSpinner(messageDisplay)
    try {
        const response = await fetch("/getConfigRec", {
            //method: "POST",
            //headers: { "Content-Type": "application/json" },
            //headers: { "Content-Type": "text/plain" },
            //body: parcelId
        })
        await checkFetchResponse(response)
        // Success
        let cr = await response.json();
        messageDisplay.textContent = ""
         _renderConfig(cr);
    } catch (err) {
        console.error(err)
        messageDisplay.textContent = `Error in Fetch: ${err.message}`
    }
}

async function _update(event) {
    // Update other dates based on planting date
    let paramData = {
        /*
        configDesc: configDesc.value,
        daysToBloom: daysToBloom.value,
        daysToGerm: daysToGerm.value,
        germinationStart: germinationStart.value,
        plantingDate: plantingDate.value,
        harvestDate: harvestDate.value,
        cureDate: cureDate.value,
        productionDate: productionDate.value,
        */
        targetTemperature: targetTemperature.value,
        heatInterval: heatInterval.value,
        heatDuration: heatDuration.value,
        waterDuration: waterDuration.value,
        waterInterval: waterInterval.value,
        configCheckInterval: configCheckInterval.value,
        loggingOn: Number(loggingSwitch.checked),
        selfieOn: Number(imagesSwitch.checked),
        autoSetOn: Number(autoSetSwitch.checked)
    }

    showLoadingSpinner(messageDisplay)
    try {
        const response = await fetch("/updConfigRec", {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(paramData)
        })
        await checkFetchResponse(response)
        // Success
        let cr = await response.json();
        messageDisplay.textContent = "Update successful "
         _renderConfig(cr);
    } catch (err) {
        console.error(err)
        messageDisplay.textContent = `Error in Fetch: ${err.message}`
    }
}

async function _water(event) {
    let paramData = {
        waterSeconds: document.getElementById("waterSeconds").value
    }

    showLoadingSpinner(messageDisplay)
    try {
        const response = await fetch("/genvWaterOn", {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(paramData)
        })
        await checkFetchResponse(response)
        // Success
        let message = await response.text();
        messageDisplay.textContent = message
    } catch (err) {
        console.error(err)
        messageDisplay.textContent = `Error in Fetch: ${err.message}`
    }
}

async function _getSelfie(event) {
    showLoadingSpinner(messageDisplay)
    try {
        const response = await fetch("/genvGetSelfie", {
        })
        await checkFetchResponse(response)
        // Success
        messageDisplay.textContent = ""
        let data = await response.text();
        imgDisplay.src = data
    } catch (err) {
        console.error(err)
        messageDisplay.textContent = `Error in Fetch: ${err.message}`
    }
 }

 function displayImage() {
     // {imgId: 1221, lastChangeTs: '2024-01-04 00:56:06', imgData: '
     messageDisplay.textContent = "ImgTS: "+imgArray[currImg].lastChangeTs+" ("+imgArray[currImg].imgId+")"
     imgDisplay.src = imgArray[currImg].imgData
 }

 function _renderConfig(cr) {
     if (cr != null) {
        configDesc.value = cr.configDesc
        daysToGerm.value = cr.daysToGerm
        daysToBloom.value = cr.daysToBloom
        germinationStart.value = cr.germinationStart
        plantingDate.value = cr.plantingDate
        harvestDate.value = cr.harvestDate
        cureDate.value = cr.cureDate
        productionDate.value = cr.productionDate
        configCheckInterval.value = cr.configCheckInterval
        // cr.logMetricInterval  minutes for selfie
        targetTemperature.value = cr.targetTemperature
        currTemperature.value = cr.currTemperature
        airInterval.value = cr.airInterval
        airDuration.value = cr.airDuration
        heatInterval.value = cr.heatInterval
        heatDuration.value = cr.heatDuration
        lightDuration.value = cr.lightDuration
        waterInterval.value = cr.waterInterval
        waterDuration.value = cr.waterDuration

        lastUpdateTs.value = cr.lastUpdateTs
        lastWaterTs.value = cr.lastWaterTs
        lastWaterSecs.value = cr.lastWaterSecs

        if (cr.loggingOn) {
            loggingSwitch.checked = true;
        } else {
            loggingSwitch.checked = false;
        }
        if (cr.selfieOn) {
            imagesSwitch.checked = true;
        } else {
            imagesSwitch.checked = false;
        }
        if (cr.autoSetOn) {
            autoSetSwitch.checked = true;
        } else {
            autoSetSwitch.checked = false;
        }
     }
 }

