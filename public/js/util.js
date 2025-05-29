/*==============================================================================
(C) Copyright 2023 John J Kauflin, All rights reserved. 
-----------------------------------------------------------------------------
DESCRIPTION:  Utility functions

-----------------------------------------------------------------------------
Modification History
2023-09-08 JJK  Initial version
2024-01-04 JJK  Added getDateStr
2024-11-30 JJK  Added the showLoadingSpinner function to display a 
                Loading... message with a built-in Bootstrap spinner
2025-05-14 JJK  Added checkFetchResponse to check status and get
                error messages from a Fetch response
=============================================================================*/

var spanSpinner = document.createElement("span")
spanSpinner.classList.add("spinner-grow","spinner-grow-sm","me-2")
spanSpinner.setAttribute("aria-hidden","true")
var spanSpinnerStatus = document.createElement("span")
spanSpinnerStatus.setAttribute("role","status")
spanSpinnerStatus.textContent = "Loading..."

export function showLoadingSpinner(buttonElement) {
    empty(buttonElement)
    buttonElement.appendChild(spanSpinner)            
    buttonElement.appendChild(spanSpinnerStatus)            
}

// Remove all child nodes from an element
export function empty(node) {
    while (node.firstChild) {
        node.removeChild(node.firstChild)
    }
}

export async function checkFetchResponse(response) {
    if (!response.ok) {
        let errMessage = "Error unknown"
        if (response.statusText != "") {
            errMessage = response.statusText
        }
        try {
            let responseText = await response.text()
            if (responseText != "") {
                errMessage = responseText
            }
            // Check if there is a JSON structure in the response (which contains errors)
            const result = JSON.parse(errMessage)
            if (result.errors != null) {
                console.log("Error: "+result.errors[0].message)
                console.table(result.errors)
                errMessage = result.errors[0].message
            }
        } catch (err) {
            // Ignore JSON parse errors from trying to find structures in the response
        }
        throw new Error(errMessage)
    } 
}

function paddy(num, padlen, padchar) {
    var pad_char = typeof padchar !== 'undefined' ? padchar : '0'
    var pad = new Array(1 + padlen).join(pad_char)
    return (pad + num).slice(-pad.length)
}
//var fu = paddy(14, 5); // 00014
//var bar = paddy(2, 4, '#'); // ###2

export function log(inStr) {
    let td = new Date()
    let tempMonth = td.getMonth() + 1
    let tempDay = td.getDate()
    let formattedDate = td.getFullYear() + '-' + paddy(tempMonth,2) + '-' + paddy(tempDay,2)
    var dateStr = `${formattedDate} ${paddy(td.getHours(),2)}:${paddy(td.getMinutes(),2)}:${paddy(td.getSeconds(),2)}.${td.getMilliseconds()}`
    console.log(dateStr + " " + inStr)
}

export function getDateStr() {
    let td = new Date()
    let tempMonth = td.getMonth() + 1
    let tempDay = td.getDate()
    let formattedDate = td.getFullYear() + '-' + paddy(tempMonth,2) + '-' + paddy(tempDay,2)
    var dateStr = `${formattedDate} ${paddy(td.getHours(),2)}:${paddy(td.getMinutes(),2)}:${paddy(td.getSeconds(),2)}`
    return(dateStr)
}

export function addDays(inDate, days) {
   let td = new Date(inDate)
   td.setDate(td.getDate() + (parseInt(days)+1))
   let tempMonth = td.getMonth() + 1
   let tempDay = td.getDate()
   let outDate = td.getFullYear() + '-' + paddy(tempMonth,2) + '-' + paddy(tempDay,2)
   return outDate;
}

export function daysFromDate(dateStr) {
    let date1 = new Date(dateStr);
    let date2 = new Date();

    // getTime() returns the number of milliseconds since January 1, 1970 00:00:00
    // Calculating the time difference
    // of two dates
    let Difference_In_Time =
        date2.getTime() - date1.getTime();
     
    // Calculating the no. of days between
    // two dates
    let Difference_In_Days =
        Math.round
            (Difference_In_Time / (1000 * 3600 * 24));
     
    // To display the final no. of days (result)
    /*
    console.log
        ("Total number of days between dates:\n" +
            date1.toDateString() + " and " +
            date2.toDateString() +
            " is: " + Difference_In_Days + " days");    
    */
   
    return(Difference_In_Days-1)
}

export function getPointDay(dateStr) {
    if (dateStr == null) {
        dateStr = getDateStr()
    }
    let yyyyMMdd = dateStr.substring(0,4) + dateStr.substring(5,7) + dateStr.substring(8,10)
    return parseInt(yyyyMMdd)   
}

export function getPointDayTime(dateStr) {
    if (dateStr == null) {
        dateStr = getDateStr()
    }
    let yyHHmmss = dateStr.substring(2,4) + dateStr.substring(11,13) + dateStr.substring(14,16) + dateStr.substring(17)
    return parseInt(yyHHmmss)
}

function formatDate(inDate) {
    var tempDate = inDate;
    if (tempDate == null) {
        tempDate = new Date();
    }
    var tempMonth = tempDate.getMonth() + 1;
    if (tempDate.getMonth() < 9) {
        tempMonth = '0' + (tempDate.getMonth() + 1);
    }
    var tempDay = tempDate.getDate();
    if (tempDate.getDate() < 10) {
        tempDay = '0' + tempDate.getDate();
    }
    return tempDate.getFullYear() + '-' + tempMonth + '-' + tempDay;
}

function formatDate2(inDate) {
    var tempDate = inDate;
    if (tempDate == null) {
        tempDate = new Date();
    }
    var tempMonth = tempDate.getMonth() + 1;
    if (tempDate.getMonth() < 9) {
        tempMonth = '0' + (tempDate.getMonth() + 1);
    }
    var tempDay = tempDate.getDate();
    if (tempDate.getDate() < 10) {
        tempDay = '0' + tempDate.getDate();
    }
    return tempDate.getFullYear() + '-' + tempMonth + '-' + tempDay;
}

var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function formatDateMonth(inDate) {
    var tempDate = inDate;
    if (tempDate == null) {
        tempDate = new Date();
    }
    return months[tempDate.getMonth()] + ' ' + tempDate.getDate() + ', ' + tempDate.getFullYear();
}

