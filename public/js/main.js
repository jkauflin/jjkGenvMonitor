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
 *============================================================================*/

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
 var updateDisplay = document.getElementById("UpdateDisplay")
 var imgDisplay = document.getElementById("ImgDisplay")
 var returnMessage = document.getElementById("returnMessage")

 var getDataButton = document.getElementById("GetDataButton")
 var updateButton = document.getElementById("UpdateButton")
 var waterButton = document.getElementById("WaterButton")
 var GetSelfieButton = document.getElementById("GetSelfieButton")

 var loggingSwitch = document.getElementById("loggingSwitch")
 var imagesSwitch = document.getElementById("imagesSwitch")
 loggingSwitch.checked = false;
 imagesSwitch.checked = false;


 //=================================================================================================================
 // Bind events
 getDataButton.addEventListener("click", _lookup);
 updateButton.addEventListener("click", _update);
 waterButton.addEventListener("click", _water);
 GetSelfieButton.addEventListener("click", _getSelfie);

 //=================================================================================================================
 // Module methods
 function paddy(num, padlen, padchar) {
    var pad_char = typeof padchar !== 'undefined' ? padchar : '0';
    var pad = new Array(1 + padlen).join(pad_char);
    return (pad + num).slice(-pad.length);
}

function _addDays(inDate, days) {
   let td = new Date(inDate)
   td.setDate(td.getDate() + (parseInt(days)+1))
   let tempMonth = td.getMonth() + 1
   let tempDay = td.getDate()
   let outDate = td.getFullYear() + '-' + paddy(tempMonth,2) + '-' + paddy(tempDay,2)
   return outDate;
}

function _lookup(event) {
    let url = '/getConfigRec';
    fetch(url)
     .then(response => {
         if (!response.ok) {
             throw new Error('Response was not OK');
         }
         return response.json();
     })
     .then(cr => {
         //console.log("TargetTemperature = "+cr.TargetTemperature)
         updateDisplay.innerHTML = ""
         _renderConfig(cr);
     })
     .catch((err) => {
         console.error(`Error in Fetch to ${url}, ${err}`);
         updateDisplay.innerHTML = "Fetch data FAILED - check log";
     });
 }

 function _update(event) {
    // Update other dates based on planting date
    harvestDate.value = _addDays(plantingDate.value,daysToBloom.value)
    cureDate.value = _addDays(harvestDate.value,14)
    productionDate.value = _addDays(cureDate.value,14)

    let url = '/updConfigRec';
    let paramData = {
        configDesc: configDesc.value,
        daysToBloom: daysToBloom.value,
        daysToGerm: daysToGerm.value,
        germinationStart: germinationStart.value,
        plantingDate: plantingDate.value,
        harvestDate: harvestDate.value,
        cureDate: cureDate.value,
        productionDate: productionDate.value,
        targetTemperature: targetTemperature.value,
        heatInterval: heatInterval.value,
        heatDuration: heatDuration.value,
        waterDuration: waterDuration.value,
        waterInterval: waterInterval.value,
        configCheckInterval: configCheckInterval.value,
        loggingOn: Number(loggingSwitch.checked),
        selfieOn: Number(imagesSwitch.checked)
     }
     fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(paramData)
     })
     .then(response => {
        if (!response.ok) {
            throw new Error('Response was not OK');
        }
        return response.json();
     })
     .then(cr => {
        updateDisplay.innerHTML = "Update successful "
        _renderConfig(cr);
     })
     .catch((err) => {
        console.error(`Error in Fetch to ${url}, ${err}`);
        updateDisplay.innerHTML = "Fetch data FAILED - check log";
     });
 }

 function _water(event) {
     let url = '/genvWaterOn';
     let paramData = {
         waterSeconds: document.getElementById("waterSeconds").value}
     fetch(url, {
         method: 'POST',
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify(paramData)
     })
     .then(response => {
         if (!response.ok) {
             throw new Error('Response was not OK');
         }
         return response.text();
     })
     .then(message => {
         updateDisplay.innerHTML = message;
     })
     .catch((err) => {
         console.error(`Error in Fetch to ${url}, ${err}`);
         updateDisplay.innerHTML = "Fetch data FAILED - check log";
     });
 }

 function _getSelfie(event) {
    updateDisplay.innerHTML = "Getting selfie...";
    let url = '/genvGetSelfie';
     fetch(url)
     .then(response => {
         if (!response.ok) {
             throw new Error('Response was not OK');
         }
         updateDisplay.innerHTML = "";
         return response.text();
     })
     .then(data => {
        imgDisplay.src = data
     })
     .catch((err) => {
         console.error(`Error in Fetch to ${url}, ${err}`)
         updateDisplay.innerHTML = "Selfie fetch FAILED"
     })
 }

 function displayImage() {
     // {imgId: 1221, lastChangeTs: '2024-01-04 00:56:06', imgData: '
     updateDisplay.innerHTML = "ImgTS: "+imgArray[currImg].lastChangeTs+" ("+imgArray[currImg].imgId+")"
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
     }
 }

