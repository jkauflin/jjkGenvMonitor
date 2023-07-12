/*==============================================================================
 * (C) Copyright 2017,2019,2021,2022,2023 John J Kauflin, All rights reserved.
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
 *============================================================================*/
var main = (function () {
    'use strict';

    //=================================================================================================================
    // Bind events
    //document.getElementById("ClearLogButton").addEventListener("click", _clearLog);
    document.getElementById("UpdateButton").addEventListener("click", _update);
    document.getElementById("WaterButton").addEventListener("click", _water);

    // Lookup values when the page loads
    _lookup();

    //=================================================================================================================
    // Module methods
    function _lookup(event) {
        let url = 'GetValues';
        fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Response was not OK');
            }
            return response.json();
        })
        .then(data => {
            _renderConfig(data);
        })
        .catch((err) => {
            console.error(`Error in Fetch to ${url}, ${err}`);
            document.getElementById("UpdateDisplay").innerHTML = "Fetch data FAILED - check log";
        });
    }

    function _update(event) {
        let url = 'UpdateConfig';
        let paramData = {
            desc: document.getElementById("desc").value,
            daysToGerm: document.getElementById("daysToGerm").value,
            daysToBloom: document.getElementById("daysToBloom").value,
            germinationStart: document.getElementById("germinationStart").value,
            plantingDate: document.getElementById("plantingDate").value,
            harvestDate: document.getElementById("harvestDate").value,
            cureDate: document.getElementById("cureDate").value,
            productionDate: document.getElementById("productionDate").value,
            targetTemperature: document.getElementById("targetTemperature").value,
            airInterval: document.getElementById("airInterval").value,
            airDuration: document.getElementById("airDuration").value,
            heatInterval: document.getElementById("heatInterval").value,
            heatDuration: document.getElementById("heatDuration").value,
            heatDurationMin: document.getElementById("heatDurationMin").value,
            heatDurationMax: document.getElementById("heatDurationMax").value,
            lightDuration: document.getElementById("lightDuration").value,
            waterDuration: document.getElementById("waterDuration").value}
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
        .then(data => {
            document.getElementById("UpdateDisplay").innerHTML = "Update successful";
            _renderConfig(data);
        })
        .catch((err) => {
            console.error(`Error in Fetch to ${url}, ${err}`);
            document.getElementById("UpdateDisplay").innerHTML = "Fetch data FAILED - check log";
        });
    }

    function _clearLog(event) {
        let url = 'ClearLog';
    }

    function _water(event) {
        let url = 'Water';
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
            document.getElementById("UpdateDisplay").innerHTML = message;
        })
        .catch((err) => {
            console.error(`Error in Fetch to ${url}, ${err}`);
            document.getElementById("UpdateDisplay").innerHTML = "Fetch data FAILED - check log";
        });
    }

    function _renderConfig(storeRec) {
        if (storeRec != null) {
            document.getElementById("desc").value = storeRec.desc;
            document.getElementById("daysToGerm").value = storeRec.daysToGerm;
            document.getElementById("daysToBloom").value = storeRec.daysToBloom;
            document.getElementById("germinationStart").value = storeRec.germinationStart;
            document.getElementById("plantingDate").value = storeRec.plantingDate;
            document.getElementById("harvestDate").value = storeRec.harvestDate;
            document.getElementById("cureDate").value = storeRec.cureDate;
            document.getElementById("productionDate").value = storeRec.productionDate;
            document.getElementById("targetTemperature").value = storeRec.targetTemperature;
            document.getElementById("airInterval").value = storeRec.airInterval;
            document.getElementById("airDuration").value = storeRec.airDuration;
            document.getElementById("heatInterval").value = storeRec.heatInterval;
            document.getElementById("heatDuration").value = storeRec.heatDuration;
            document.getElementById("heatDurationMin").value = storeRec.heatDurationMin;
            document.getElementById("heatDurationMax").value = storeRec.heatDurationMax;
            document.getElementById("lightDuration").value = storeRec.lightDuration;
            document.getElementById("waterDuration").value = storeRec.waterDuration;
        }

    }

    //=================================================================================================================
    // This is what is exposed from this Module
    return {};

})(); // var main = (function(){
