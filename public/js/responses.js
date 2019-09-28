/*==============================================================================
 * (C) Copyright 2015,2016,2017,2018 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 * 
 *----------------------------------------------------------------------------
 * Modification History
 * 2018-07-21 JJK 	Initial version using jquery and bootstrap 3
 * 2018-07-22 JJK	Got responses search and display working
 * 2018-07-25 JJK 	Completed the update functions for responses and jokes
 * 2018-09-03 JJK	Removed Venue from list display and added labels
 * 2018-12-18 JJK	Re-factored to use modules
 * 2019-02-09 JJK   Added robotCommand to responses
 *============================================================================*/
var responses = (function () {
    'use strict';

    //=================================================================================================================
    // Private variables for the Module
    var isTouchDevice = 'ontouchstart' in document.documentElement;
    var getDataService = "getResponses.php";
    var updateDataService = "updateResponses.php";
    var displayFields = ["id", "deleted", "keywords", "verbalResponse", "robotCommand", "score"];
    var editClass = "EditResponses";
    var searchStrName = "keywords";

    //=================================================================================================================
    // Variables cached from the DOM
    var $ModuleDiv = $('#ResponsesPage');
    var $SearchButton = $ModuleDiv.find("#SearchResponses");
    var $SearchStr = $ModuleDiv.find("#" + searchStrName);
    var $ClearButton = $ModuleDiv.find("#ClearResponses");
    var $Inputs = $ModuleDiv.find("#ResponsesInput");
    var $ListDisplay = $ModuleDiv.find("#ResponsesListDisplay tbody");
    var $UpdateButton = $ModuleDiv.find("#UpdateResponses");

    //=================================================================================================================
    // Bind events
    $SearchButton.click(_search);
    $ClearButton.click(_clear);
    $UpdateButton.click(_update);
    $ModuleDiv.on("click", "." + editClass, _edit);

    //=================================================================================================================
    // Module methods
    function _search(event) {
        util.searchDataDisplay(getDataService, searchStrName + "=" + $SearchStr.val(), displayFields, $ListDisplay, editClass);
    }

    function _clear(event) {
        util.clearInputs($Inputs);
    }

    function _edit(event) {
        util.editDataRecord(getDataService, "id=" + event.target.getAttribute("data-id"), $Inputs);
    }

    function _update(event) {
        var paramMap = null;
        //var paramMap = new Map();
        //paramMap.set('parcelId', event.target.getAttribute("data-Id"));
        util.updateDataRecord(updateDataService, $Inputs, paramMap, displayFields, $ListDisplay, editClass);
    }

    //=================================================================================================================
    // This is what is exposed from this Module
    return {
    };

})(); // var responses = (function(){
